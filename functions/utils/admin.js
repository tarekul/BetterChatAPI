const admin = require("firebase-admin");
const serviceAccount = require("../better-f844e-firebase-adminsdk-ocg63-8feb514c1d");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://better-f844e.firebaseio.com"
});

const db = admin.firestore();

module.exports = {
  admin,
  db
};
