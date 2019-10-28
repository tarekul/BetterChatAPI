const functions = require("firebase-functions");
const express = require("express");
const app = express();
const firebase = require("firebase");
const { config } = require("./utils/config");
firebase.initializeApp(config);
const { admin, db } = require("./utils/admin");
const { validateSignUp, validateLogin } = require("./utils/validator");
const { FBauth } = require("./utils/FBauth");
const cors = require("cors");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(cors());

app.post("/signup", (req, res) => {
  const { email, password, confirmPassword, username } = req.body;
  const validRes = validateSignUp(email, password, confirmPassword, username);
  let uid;
  let token;
  if (!validRes.valid) return res.status(400).json(validRes.errors);
  else {
    db.doc(`/users/${username}`)
      .get()
      .then(doc => {
        if (doc.exists)
          return res.status(400).json({ general: "User already exists" });
        else
          return firebase
            .auth()
            .createUserWithEmailAndPassword(email, password);
      })
      .then(data => {
        uid = data.user.uid;
        return data.user.getIdToken();
      })
      .then(idToken => {
        db.doc(`/users/${username}`).set({
          username: username,
          email: email,
          uid: uid,
          imageUrl: `https://i.pravatar.cc/300/?img=${Math.round(
            Math.random() * 70
          )}`
        });
        return res.status(201).json(idToken);
      })
      .catch(err => {
        console.error(err);
        if (
          err.code === "auth / weak - password" ||
          err.code === "auth/user-not-found"
        )
          return res
            .status(400)
            .json({ general: "Wrong Credentials. Please try again" });
        else return res.status(500).json({ general: err.code });
      });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const resVal = validateLogin(email, password);
  if (!resVal.valid) return res.status(400).json(resVal.errors);
  else {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(data => {
        return data.user.getIdToken();
      })
      .then(idToken => {
        return res.status(201).json(idToken);
      })
      .catch(err => {
        console.error(err);
        if (
          err.code === "auth / weak - password" ||
          err.code === "auth/user-not-found"
        )
          return res
            .status(400)
            .json({ general: "Wrong Credentials. Please try again" });
        else return res.status(500).json({ general: err.code });
      });
  }
});

app.post("/post", FBauth, (req, res) => {
  const { body } = req.body;
  if (body.trim() === "")
    return res.status(400).json({ error: "body cannot be empty" });
  const username = req.username;
  const newPost = {
    username: username,
    body: body,
    imageUrl: req.image,
    createdAt: new Date().toISOString()
  };
  db.collection("posts")
    .add(newPost)
    .then(doc => {
      const resPost = newPost;
      resPost.postId = doc.id;
      res.status(201).json(resPost);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
});

app.get("/posts", (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "asc")
    .get()
    .then(snapshot => {
      let posts = [];
      snapshot.forEach(doc => {
        const postData = doc.data();
        postData.postId = doc.id;
        posts.push(postData);
      });
      res.status(201).json(posts);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
});

app.post("/image", FBauth, (req, res) => {
  const username = req.username;

  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (
      mimetype !== "image/jpg" &&
      mimetype !== "image/jpeg" &&
      mimetype !== "image/png"
    ) {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(Math.random() * 10000000)}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    file.pipe(fs.createWriteStream(filepath));
    imageToBeUploaded = {
      filepath,
      mimetype
    };
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath)
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/better-f844e.appspot.com/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${username}`).update({
          imageUrl
        });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
});

exports.api = functions.https.onRequest(app);
exports.onUserImageChange = functions.firestore
  .document("/users/{id}")
  .onUpdate(change => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      db.collection("posts")
        .where("username", "==", change.after.data().username)
        .get()
        .then(snapshot => {
          const batch = db.batch();
          snapshot.forEach(doc => {
            const post = db.doc(`/posts/${doc.id}`);
            batch.update(post, { imageUrl: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
    return true;
  });
