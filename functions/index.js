const functions = require("firebase-functions");
const { db } = require("./util/admin");
const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAthenticatedUser,
} = require("./handlers/users");
const FBAuth = require("./util/fbAuth");
const app = require("express")();

// Screams route
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);
app.get("/scream/:screamId", getScream);
app.delete("/scream/:screamId", FBAuth, deleteScream);
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);
app.get("/scream/:screamId/like", FBAuth, likeScream);
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);

// User route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAthenticatedUser);

exports.api = functions.region("europe-west3").https.onRequest(app);

exports.createNotificatinOnLike = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onCreate((snap) => {
    db.doc(`/screams/${snap.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snap.id}`).set({
            screamId: doc.id,
            recipient: doc.data().userHandle,
            sender: snap.data().userHandle,
            createdAt: new Date().toISOString(),
            type: "like",
            read: false,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.deletNotificatinOnUnLike = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onDelete((snap) => {
    db.doc(`/notifications/${snap.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificatinOnComment = functions
  .region("europe-west3")
  .firestore.document("comments/{id}")
  .onCreate((snap) => {
    db.doc(`/screams/${snap.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return db.doc(`/notifications/${snap.id}`).set({
            screamId: doc.id,
            recipient: doc.data().userHandle,
            sender: snap.data().userHandle,
            createdAt: new Date().toISOString(),
            type: "comment",
            read: false,
          });
        }
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
