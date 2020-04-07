const functions = require("firebase-functions");
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login, uploadImage } = require("./handlers/users");
const FBAuth = require("./util/fbAuth");

const app = require("express")();

// Screams route
app.get("/screams", getAllScreams);
// Post one scream
app.post("/scream", FBAuth, postOneScream);
// signup route
app.post("/signup", signup);
// Signin route
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);

exports.api = functions.region("europe-west1").https.onRequest(app);
