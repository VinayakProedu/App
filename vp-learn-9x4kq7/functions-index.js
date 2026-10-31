// functions/index.js
// Firebase Functions v2 + Firebase Admin + Nodemailer.
// This trigger preserves the existing teacher page and watches its replies[] array.
// Before production, test duplicate delivery and verify your teacher reply objects use by: "faculty".

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const nodemailer = require("nodemailer");

initializeApp();
const db = getFirestore();

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const MAIL_FROM = defineSecret("MAIL_FROM");

exports.emailStudentOnFacultyReply = onDocumentUpdated({
  document: "studentDoubts/{doubtId}",
  secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM],
  retry: true
}, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || !after.userId) return;

  const oldReplies = Array.isArray(before.replies) ? before.replies : [];
  const newReplies = Array.isArray(after.replies) ? after.replies : [];
  if (newReplies.length <= oldReplies.length) return;

  const added = newReplies.slice(oldReplies.length).filter(r =>
    ["faculty", "admin"].includes(String(r.by || "").toLowerCase())
  );
  if (!added.length) return;

  // Deterministic event key makes retries of the same Firestore event idempotent.
  // Note: separate edits that append the same reply again are distinct events;
  // the teacher workflow should not append duplicate replies.
  const eventId = event.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const eventRef = db.collection("studentDoubts")
    .doc(event.params.doubtId)
    .collection("emailNotificationEvents").doc(eventId);

  const claim = await db.runTransaction(async tx => {
    const existing = await tx.get(eventRef);
    if (existing.exists && existing.data().status === "sent") return false;
    if (existing.exists && existing.data().status === "processing") return false;
    tx.set(eventRef, {
      status: "processing",
      createdAt: FieldValue.serverTimestamp(),
      recipientUid: after.userId
    }, { merge: true });
    return true;
  });
  if (!claim) return;

  try {
    const account = await getAuth().getUser(after.userId);
    if (!account.email || !account.emailVerified) {
      throw new Error("Student has no verified email address.");
    }

    const latest = added[added.length - 1];
    const port = Number(SMTP_PORT.value() || 587);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port,
      secure: port === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
    });

    await transporter.sendMail({
      from: MAIL_FROM.value(),
      to: account.email,
      subject: `Faculty replied to your doubt: ${after.topic || "General"}`,
      text: `Your faculty has replied to your doubt in ${after.courseSubject || "your course"}.\n\n` +
        `${String(latest.text || "").slice(0, 2000)}\n\n` +
        `Sign in to your Vinayak ProEdu Student Portal to continue the conversation.`
    });

    await eventRef.set({
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      recipient: account.email
    }, { merge: true });
  } catch (err) {
    await eventRef.set({
      status: "failed",
      error: String(err.message || err).slice(0, 500),
      failedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    throw err;
  }
});


// Admin-only student invitation. Uses a password-reset action link as the first-time
// password setup link; never creates a password or exposes SMTP credentials in the browser.
exports.inviteStudent = onCall({
  region: "asia-south1",
  // Explicitly allow the production admin portal origins for callable preflight requests.
  cors: ["https://www.vinayakproedu.com", "https://vinayakproedu.com"],
  secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM],
  enforceAppCheck: false
}, async request => {
  const callerEmail = String(request.auth?.token?.email || "").toLowerCase();
  if (!request.auth || callerEmail !== "vinayakproedu@gmail.com") {
    throw new HttpsError("permission-denied", "Only the authorised admin can add students.");
  }

  const name = String(request.data?.name || "").trim();
  const email = String(request.data?.email || "").trim().toLowerCase();
  const phone = String(request.data?.phone || "").trim();
  const batchCode = String(request.data?.batchCode || "").trim().toUpperCase();
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 30 || !batchCode) {
    throw new HttpsError("invalid-argument", "Provide a valid name, email, phone and batch.");
  }

  const batchSnap = await db.collection("batches").doc(batchCode).get();
  if (!batchSnap.exists || String(batchSnap.data().code || "") !== batchCode) {
    throw new HttpsError("failed-precondition", "The selected batch no longer exists. Refresh and choose a batch again.");
  }
  const batch = batchSnap.data();
  const adminAuth = getAuth();
  let account, created = false;
  try {
    account = await adminAuth.getUserByEmail(email);
    const existingProfile = await db.collection("users").doc(account.uid).get();
    const role = String(existingProfile.data()?.role || "").toLowerCase();
    if (existingProfile.exists && !["student", "trial"].includes(role)) {
      throw new HttpsError("already-exists", "This email belongs to an account that is not a student.");
    }
    if (!existingProfile.exists && account.email !== email) {
      throw new HttpsError("already-exists", "An account already exists for this email.");
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error.code !== "auth/user-not-found") throw new HttpsError("internal", "Could not check the existing account.");
    try {
      account = await adminAuth.createUser({ email, displayName: name, emailVerified: false, disabled: false });
      created = true;
    } catch (createError) {
      if (createError.code === "auth/email-already-exists") throw new HttpsError("already-exists", "An account already exists for this email.");
      throw new HttpsError("internal", "Could not create the student account.");
    }
  }

  await db.collection("users").doc(account.uid).set({
    uid: account.uid, name, email, phone, role: "student", batchCode,
    batchName: String(batch.name || ""),
    ...(created ? { createdAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(),
    invitedBy: request.auth.uid
  }, { merge: true });

  try {
    const actionLink = await adminAuth.generatePasswordResetLink(email, {
      url: "https://www.vinayakproedu.com/",
      handleCodeInApp: false
    });
    const port = Number(SMTP_PORT.value() || 587);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(), port, secure: port === 465,
      auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
    });
    await transporter.sendMail({
      from: MAIL_FROM.value(), to: email,
      subject: "Set up your Vinayak ProEdu student account",
      text: `Hello ${name},\n\nYour Vinayak ProEdu student account has been created and assigned to ${batch.name || batchCode}. Use the secure link below to set your password:\n\n${actionLink}\n\nIf you did not expect this email, please contact Vinayak ProEdu.`,
      html: `<p>Hello ${String(name).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))},</p><p>Your Vinayak ProEdu student account has been created and assigned to <strong>${String(batch.name || batchCode).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}</strong>.</p><p><a href="${actionLink}">Set your password</a></p><p>If you did not expect this email, please contact Vinayak ProEdu.</p>`
    });
  } catch (error) {
    console.error("Student account exists but setup email failed", { uid: account.uid, code: error.code || "unknown" });
    throw new HttpsError("internal", "The student record was saved, but the setup email could not be sent. Check SMTP settings and retry the invitation.");
  }
  return { ok: true, message: `Student added to ${batch.name || batchCode}. Password setup email sent to ${email}.` };
});
