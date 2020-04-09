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
  getUserDetails,
  markNotificationsRead,
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
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west3").https.onRequest(app);

exports.createNotificatinOnLike = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onCreate((snap) => {
    return db
      .doc(`/screams/${snap.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snap.data().userHandle) {
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
      .catch((err) => console.error(err));
  });

exports.deleteNotificatinOnUnLike = functions
  .region("europe-west3")
  .firestore.document("likes/{id}")
  .onDelete((snap) => {
    return db
      .doc(`/notifications/${snap.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificatinOnComment = functions
  .region("europe-west3")
  .firestore.document("comments/{id}")
  .onCreate((snap) => {
    return db
      .doc(`/screams/${snap.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().userHandle !== snap.data().userHandle) {
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
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west3")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageURL !== change.after.data().imageURL) {
      let batch = db.batch();
      return db
        .collection("screams")
        .where("userHndle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc("/screams/${doc.id");
            batch.update(scream, { userImage: change.after.data().imageURL });
          });
          return batch.update();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region("europe-west3")
  .firestore.document("/screams/{screamId}")
  .onDelete((snap, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
