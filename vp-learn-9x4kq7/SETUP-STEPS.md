# Vinayak ProEdu Doubt Centre — copy/paste package

## Files
- `index.html`: complete student portal based on the supplied `index (2).html`; the Doubt Centre has image/PDF attachments and follow-up conversations.
- `functions-index.js`: server-side email trigger example. Rename to `functions/index.js` only after checking whether the repository already has a Functions entry point. Do not overwrite an existing Functions file without merging its exports.

## 1. Replace the student page
1. Back up the current student portal file.
2. Replace its contents with `index.html` from this package.
3. Keep it at the same path/name used by your hosting configuration (rename it to the expected `index.html` if required).
4. Do not replace or edit `doubts.html` for this student-side change.

## 2. Configure email trigger (Firebase Functions)
The supplied function expects Firebase Functions v2, `firebase-admin`, `firebase-functions` and `nodemailer`.
From the project's root directory, inspect `firebase.json`, `.firebaserc`, and `functions/package.json` first. If the project has no Functions setup:
- `firebase init functions` (choose JavaScript and the same Firebase project; do not overwrite existing files).
- In `functions/`, install dependencies: `npm install firebase-admin firebase-functions nodemailer`.
- Copy `functions-index.js` to `functions/index.js` only if no existing `functions/index.js` exists. Otherwise merge the export into the existing file and retain all current exports.
- Confirm `firebase.json` has a Functions source entry pointing to `functions`.
- Set SMTP secrets using the Firebase CLI, one by one:
  `firebase functions:secrets:set SMTP_HOST`
  `firebase functions:secrets:set SMTP_PORT`
  `firebase functions:secrets:set SMTP_USER`
  `firebase functions:secrets:set SMTP_PASS`
  `firebase functions:secrets:set MAIL_FROM`
  Enter the values requested by the CLI; never paste secrets into HTML or source control.
- Deploy only this function after reviewing the target project:
  `firebase deploy --only functions:emailStudentOnFacultyReply`

## 3. Storage and security rules are mandatory
Before testing, update/test Firestore and Storage rules so:
- students can read/write only doubts where `userId == request.auth.uid`;
- student updates cannot impersonate `faculty` or `admin`, alter ownership, or modify teacher reply fields;
- only authorized teacher/admin accounts can add faculty replies;
- attachments are limited to the owner and authorized faculty, under `doubt-attachments/{doubtId}/{uid}/...`;
- uploads validate allowed MIME types and size (8 MB) in Storage Rules as well as in the UI.
Do not deploy the page until the rules enforce this. UI checks are not security.

## 4. Important compatibility checks
- Existing teacher page stores replies in `replies[]`; this code appends student follow-ups with `by: "student"` and reopens the doubt. Check that this matches the teacher page's status rendering.
- This code stores new attachments as `attachments: [{storagePath,name,contentType,size}]`. The current teacher page may not render all new attachment formats unless its existing renderer is extended. The page layout can stay the same, but new attachments must be accessible to faculty.
- The trigger only sends when appended reply objects have `by: "faculty"` or `by: "admin"`. Verify the teacher reply code uses one of these values.
- The function uses a notification-event record to avoid processing the same Firestore event ID twice. Email providers can still have ambiguous delivery failures; test retries before relying on it operationally.
- No email is sent for student follow-ups. The recipient is looked up server-side from the doubt owner's Firebase Auth UID, never from a client-supplied email.
- The function expects verified Firebase Auth email addresses. If your accounts don't set `emailVerified`, adjust the policy deliberately before deployment.

## 5. Test before production
Use a Firebase emulator or test project:
1. Submit a text-only doubt.
2. Submit a doubt with an image and a PDF.
3. Send a follow-up and confirm status becomes `open`.
4. Reply as faculty and confirm only that doubt owner's email receives a message.
5. Confirm a second student's email receives nothing.
6. Test duplicate trigger deliveries and failed SMTP delivery.
7. Verify students cannot read another student's doubt or another student's attachments.
8. Verify old doubts and old `screenshotUrl`/`attachmentUrl` records still display.

## Current status
This package has not been deployed. Firebase rules, current Functions setup, SMTP provider credentials and the live project configuration were not available for verification in the supplied HTML files. Treat the function and setup instructions as a copy/paste starting point, not proof that production security/configuration is already correct.
