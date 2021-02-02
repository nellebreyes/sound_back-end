const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.authorized = (req, res, next) => {

  let token;
  if (req.headers.token) {
    token = req.headers.token || "";
  } else if (req.body.headers.token) {
    token = req.body.headers.token || "";
  } else {
    token = "";
  }

  if (token === "null") {
    //console.log("Sorry you need to be a registered user to use this app");
    res.send("Sorry you need to be logged in to perform this action");
    return;
  }
  if (jwt.verify(token, process.env.JWTSECRET)) {
    //console.log("authorized"); note, do not send result to the client if this is a middleware
    next();
  }
};

exports.login = (req, res) => {
  //  console.log(req.body);

  let user = new User(req.body);
  user
    .login()
    .then((result) => {
      if (result) {
        const { id, name } = result;
        let token = jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, {
          expiresIn: "365d",
        });
        // console.log("userController", { id, name });
        res.send({ id, name, token, email: user.data.email });
      }
    })
    .catch((err) => {
      res.send({ error: err });
    });
};

exports.register = (req, res) => {
  let user = new User(req.body);
  // console.log("useController", req.body);
  user
    .register()
    .then((result) => {
      //  console.log(result);
      let token = jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, {
        expiresIn: "365d",
      });
      // console.log(user);
      res.send({ result, token, firstName: user.data.name });
    })
    .catch((err) => {
      // console.log(err);
      res.send(err);
    });
};


//
exports.ifVisitorIsOwner = (req, res, next) => {
  //console.log("IncomingIfVisitorIsOwnerData", req);
  //console.log(req.headers.localstorageloginid == "null");
  //if data is sent as data, console.log("this is the reqbody", req.body.headers.localstorageloginid);
  //used by viewSinglemedia
  if (req.headers.localstorageloginid === "null") {
    next();
  }

  User.ifVisitorIsOwner({
    mediaId: req.params.id,
    visitorId:
      req.headers.localstorageloginid || req.body.headers.localstorageloginid,
  })
    .then((result) => {
      req.isVisitor = result.isOwner;
      req.ownerid = result.ownerid;
      //console.log("isownerid", req.ownerid);
      //go to mediaCont-viewsingle
      next();
    })
    .catch((err) => {
      console.log({
        error: "You are not the owner of this media",
      });
    });
};


