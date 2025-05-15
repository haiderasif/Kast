const admin = require("firebase-admin");

const serviceAccount = require("../kast-14ee0-firebase-adminsdk-fbsvc-a7def731b8.json"); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
