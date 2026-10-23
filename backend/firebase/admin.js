const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_PATH is required. See backend/.env.example."
  );
}

// Relative paths are resolved from the backend directory, not from whichever
// directory was used to launch Node.
const resolvedServiceAccountPath = path.resolve(__dirname, "..", serviceAccountPath);
const serviceAccount = require(resolvedServiceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

module.exports = admin;
