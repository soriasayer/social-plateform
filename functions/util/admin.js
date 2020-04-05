const admin = require("firebase-admin");
const serviceAccount = require('../../keys/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-224d2.firebaseio.com",
});

const db = admin.firestore();

module.exports = {admin, db}
