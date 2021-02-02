const router = require("express").Router();
const userController = require("./controllers/userController");
const mediaController = require("./controllers/mediaController");


//testing purpose
router.get("/", (req, res) => res.json("Backend is up and running."));

//user related routes
router.post("/login", userController.login);
router.post("/register", userController.register);


 //media related routes
router.post("/add-media", userController.authorized, mediaController.add);
router.get(
  "/view-media/:id",
  userController.ifVisitorIsOwner,
  mediaController.viewSingle
);



module.exports = router;
