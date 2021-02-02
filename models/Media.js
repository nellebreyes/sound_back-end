const { ObjectId } = require("mongodb");
const db = require("../server");
const fs = require("fs");


let Media = function (data) {
  this.data = data;
  this.errors = [];
};

Media.prototype.validate = async function () {
  // console.log(this.data.fields.mediaTitle);
  // console.log(this.data.fields.instructions);
  let con = db.db;
  const postCollection = con.collection("posts");

  if (this.data.err) {
    this.errors.push(this.data.err);
  }
  if (this.data.fields.mediaTitle == "") {
    this.errors.push("Media title is required");
  } else if (this.data.fields.mediaTitle.length < 5) {
    this.errors.push("Media title should be atleast 5 characters");
  }

  if (this.data.files.sound == "") {
    this.errors.push("Media is required");
  } 
  
  let result = await postCollection.findOne({
    email: this.data.email,
    mediaTitle: this.data.fields.mediaTitle,
  });
  if (result) {
    this.errors.push(
      "The media you are trying to save is already on your list."
    );
  }
};

Media.prototype.addmedia = function () {
  // console.log("Media model-addMedia", this.data);
  return new Promise(async (resolve, reject) => {
    this.data = {
      err: this.data.err || "",
      fields: {
        mediaTitle: this.data.fields.mediaTitle || "",
        instructions: this.data.fields.instructions || "",
      },
      files: { media: this.data.files.media || "" },
      email: this.data.email || "",
      ownerid: this.data.ownerid || "",
      ownername: this.data.ownername
    };

    await this.validate();
    //console.log("ready to insert: ", this.data, this.errors);
    if (!this.errors.length) {
      // resolve("congrats we are now ready to save your media");
      let con = db.db;
      const postCollection = con.collection("posts");
      let mediaTitle = this.data.fields.mediaTitle;
      mediaTitle =
        mediaTitle.charAt(0).toUpperCase(0) +
        mediaTitle.slice(1, mediaTitle.length);

        let media = {
          data: fs.readFileSync(this.data.files.media.path),
          name: this.data.files.media.name,
          contentType: this.data.files.media.type,
          size: this.data.files.media.size,
        };

      this.data = {
        email: this.data.email.trim(),
        ownerid: this.data.ownerid,
        ownername: this.data.ownername,
        mediaTitle: mediaTitle,
        instructions: this.data.fields.instructions,
        media: media,
        datePosted: new Date(),
      };

      postCollection
        .insertOne(this.data)
        .then((result) => {
          resolve({ newMediaId: result });
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      reject({ error: this.errors });
    }
  });
};

Media.prototype.findMediaById = function () {
  // console.log("media.js-findMediaById", this.data);
  // do sanitation of data later
  return new Promise(async (resolve, reject) => {
    //resolve({ resultInModel: this.data });
    let con = db.db;
    let postsCollection = con.collection("posts");
    let usersCollection = con.collection("users");
    let name;

    if (typeof this.data !== "string" || !ObjectId.isValid(this.data)) {
      reject("Invalid media id");
      return;
    }
    await postsCollection
      .findOne({ _id: ObjectId(this.data) })
      .then(async (mediaResult) => {
        //console.log("medias", mediaResult);
        let results = await usersCollection
          .aggregate([{ $match: { email: mediaResult.email } }])
          .toArray();

        if (results.length) {
          // console.log("results-media.js-findMediaById", results);
          results = results.map((result) => {
            return (result = {
              name: result.name,
            });
          });
          // console.log("target", results[0]);
          name = results[0];
        }

        if (mediaResult) {
          //console.log("mediaResult-media.js-findMediaById", mediaResult);
          resolve({
            name,
            mediaResult,
          });
        }
        if (!mediaResult) {
          // console.log("no media Found", mediaResult);
          resolve({ name });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};


module.exports = Media;
