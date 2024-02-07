const express = require("express");
const multer = require("multer");
const userAuthController = require("../controllers/userAuthController");
const router = express.Router();




router.post("/user/register",userAuthController.register);
router.post("/user/login", userAuthController.login);
router.post("/user/completeSignup", userAuthController.completeSignup);
router.post("/user/logout", userAuthController.logout);

module.exports = router;


