const media = require("../models/Media");
const formidable = require("formidable");

exports.add = (req, res) => {
 // console.log("IncomingmediaController", req.headers);
  let form = new formidable.IncomingForm();
  let email = req.headers.email;
  let ownerid = req.headers.ownerid;
  let ownername =  req.headers.ownername;
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    let media = new media({ err, fields, files, email, ownerid, ownername });
    media
      .addmedia()
      .then((result) => {
        res.send(result);
      })
      .catch((e) => res.send(e));
  });
};


exports.viewSingle = (req, res) => {
  // console.log("IncomingFormediaController", req.ownerid);
  //console.log("IncomingFormediaController", req.isVisitor);
  let media = new media(req.params.id);
  media
    .findMediaById()
    .then((result) => {
      result.isVisitorTheOwner = req.isVisitor;
      result.ownerid = req.ownerid;
      // console.log("usermodel-findmediaById", result);
      //  console.log("ReqIsVisitorAsResultProperty", req.isVisitor);
      res.send(result);
      return;
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

