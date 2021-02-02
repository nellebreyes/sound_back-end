const db = require("../server");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

let User = function (data) {
  this.data = data;
  this.errors = [];
};

User.prototype.login = function () {
  //console.log("User model", this.data);
  let con = db.db;
  let { email } = this.data;
  if (email !== "") {
    email = email.trim().toLowerCase();
  }

  userCollection = con.collection("users");

  return new Promise((resolve, reject) => {
    userCollection
      .findOne({ email: this.data.email })
      .then((userDoc) => {
        //if mongodb finds that user, it is going to pass an argument to the .then(),ie userDoc
        //if you forget to pass in the userDoc argument in the .then, this will NOT work
        //the compareSync takes 2 arguments, the password entered and the password saved in the db
        if (
          userDoc &&
          bcrypt.compareSync(this.data.password, userDoc.password)
        ) {
          // console.log("user model", userDoc);
          resolve({ id: userDoc._id, name: userDoc.name });
        } else {
          reject("email not found");
        }
      })
      .catch((err) => {
        //database error or unexpected error beyond our control
        reject("Please try again later");
      });
  });
};

User.prototype.validate = function () {
  if (this.data.firstName == "") {
    this.errors.push("First Name is required.");
  } else if (!validator.isAlpha(this.data.firstName)) {
    this.errors.push("First Name must contain only letters");
  }

  if (this.data.email == "") {
    this.errors.push("Email is required");
  } else if (!validator.isEmail(this.data.email)) {
    this.errors.push("Please enter a valid email.");
  }

  if (this.data.password == "") {
    this.errors.push("Password is required");
  } else if (this.data.password.length < 6 || this.data.password.length > 15) {
    this.errors.push(
      "Password length must be between 6 to 15 characters only."
    );
  }

  if (this.data.confirmPassword == "") {
    this.errors.push("Confirm password is a required field");
  } else if (
    this.data.password !== "" &&
    this.data.confirmPassword !== this.data.password
  ) {
    this.errors.push("Confirm password and password must match");
  }
};

User.prototype.register = function () {
  return new Promise((resolve, reject) => {
    //if field is not set, make the field empty
    this.data = {
      firstName: this.data.firstName || "",
      email: this.data.email || "",
      password: this.data.password || "",
      confirmPassword: this.data.confirmPassword || "",
    };

    //trim
    this.data = {
      firstName: this.data.firstName.trim().toLowerCase(),
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password,
      confirmPassword: this.data.confirmPassword,
    };
    //validate
    this.validate();

    if (this.errors.length) {
      reject(this.errors);
    } else {
      //console.log("cleansed", this.data);
      let con = db.db;
      const userCollection = con.collection("users");
      userCollection.findOne({ email: this.data.email }).then((userDoc) => {
        if (userDoc) {
          reject("The email you are trying to register is already taken");
        } else {
          //hash user password
          let salt = bcrypt.genSaltSync(10);
          this.data = {
            name: this.data.firstName,
            email: this.data.email,
            password: (this.data.password = bcrypt.hashSync(
              this.data.password,
              salt
            )),
          };

          userCollection
            .insertOne(this.data)
            .then(() => {
              resolve("Thank you for signing-up, you can now log in.");
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    }
  });
};

User.findUserById = function (id) {
  return new Promise(async (resolve, reject) => {
    //  console.log("incoming req params", id);
    if (id == "") {
      reject("You must include the user id to make this request");
    }
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      reject("userModel error, invalid user id");
      return;
    }
    let con = db.db;
    let usersCollection = con.collection("users");

    await usersCollection
      .findOne({ _id: ObjectId(id) })
      .then((userDoc) => {
        // console.log("userModel", userDoc);
        //if found
        if (userDoc) {
          resolve({ name: userDoc.name, email: userDoc.email });
        } else {
          reject();
        }
      })
      .catch((err) => {
        reject({ error: err });
      });
  });
};

User.findMediasByEmail = function (email) {
  //console.log("incomingFindMediasByEmailData", email);
  return new Promise(async (resolve, reject) => {
    let con = db.db;
    let postsCollection = con.collection("posts");
    email = email;
    await postsCollection
      .aggregate(
        { $match: { email } },
        { $sort: { mediaTitle: 1, datePosted: -1 } },
        {
          $lookup: {
            from: "posts",
            localField: "email",
            foreignField: "email",
            as: "medias",
          },
        }
      )
      .toArray()
      .then((medias) => {
        if (!medias.length) {
          reject();
          return;
        }
        // console.log(medias);
        resolve(medias);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

User.ifVisitorIsOwner = function (data) {
  return new Promise(async (resolve, reject) => {
    // console.log("IncomingDataInUserModel", data);
    //add more validation for url next time
    if (typeof data.mediaId !== "string" || !ObjectId.isValid(data.mediaId)) {
      reject("userModel error, invalid media id");
      return;
    }

    let con = db.db;
    let postsCollection = con.collection("posts");
    let usersCollection = con.collection("users");

    await postsCollection
      .findOne({ _id: ObjectId(data.mediaId) })

      .then(async (mediaDoc) => {
        let mediaDocEmail = mediaDoc.email;

        await usersCollection
          .findOne({ _id: ObjectId(data.visitorId) })
          .then((userDoc) => {
            if (userDoc.email === mediaDocEmail) {
              // console.log("isEmailTheDame", userDoc.email === mediaDocEmail);
              resolve({ isOwner: true, ownerid: mediaDoc.ownerid });
            } else {
              //test resolve changed to reject
              resolve({ isOwner: false, ownerid: mediaDoc.ownerid });
            }
          })
          .catch((err) => {
            reject({ error: "User not found" }); //db error
          });
      })
      .catch((err) => {
        reject({ error: err }); //db error
      });
  });
};

module.exports = User;
