// functions/index.js
// Firebase Functions v2 + Firebase Admin + Nodemailer.
// This trigger preserves the existing teacher page and watches its replies[] array.
// Before production, test duplicate delivery and verify your teacher reply objects use by: "faculty".

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
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
