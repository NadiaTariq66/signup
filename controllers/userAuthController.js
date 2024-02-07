const express = require("express");
const app = express();
const User = require("../models/User/user.js");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const userDTO = require("../dto/user.js");
const JWTService = require("../services/JWTService.js");
const RefreshToken = require("../models/token.js");
const AccessToken = require("../models/accessToken.js");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const userAuthController = {
  async register(req, res, next) {
    const userRegisterSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const { error } = userRegisterSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const {
      name,
      email,
      password
      
    } = req.body;

    let accessToken;
    let refreshToken;

    let user;
    try {
      const userToRegister = new User({
        name,
        email,
        password,
        
      });

      user = await userToRegister.save();

      // token generation
      accessToken = JWTService.signAccessToken({ _id: user._id }, "365d");

      refreshToken = JWTService.signRefreshToken({ _id: user._id }, "365d");
    } catch (error) {
      return next(error);
    }

    // store refresh token in db
    await JWTService.storeRefreshToken(storeRefreshToken, user._id);
    await JWTService.storeAccessToken(accessToken, user._id);

    // 6. response send

    return res
      .status(201)
      .json({ user: user, auth: true, token: accessToken });
  },
  async login(req, res, next){
    userLogInSchema=Joi.object({
      email: Joi.string().required(),
      password: Joi.string().pattern(passwordPattern),
    });
    const {error}=userLogInSchema.validate(req.body);

    if(error)
    return next(error)
    const { email, password } = req.body;

    let user;

    try {
      // match email through emailRegex bana rahe hain, jismein email variable ke value ka pattern match karna hai. "i" 
      const emailRegex = new RegExp(email, "i");
      user = await User.findOne({ email: { $regex: emailRegex } });
      if (!user) {
        const error = {
          status: 401,
          message: "Invalid email",
        };

        return next(error);
      }
     
      //..password match

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        const error = {
          status: 401,
          message: "Invalid Password",
        };

        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    const accessToken = JWTService.signAccessToken({ _id: user._id }, "365d");
    const refreshToken = JWTService.signRefreshToken(
      { _id: user._id },
      "365d"
    );

//update token
    try {
      await RefreshToken.updateOne(
        {
          userId: user._id,
        },
        { token: refreshToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    try {
      await AccessToken.updateOne(
        {
          userId: user._id,
        },
        { token: accessToken },
        // upsert combination hta hai update or insert ka document ko update krta h
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }

    const userDto = new userDTO(user);

    return res
      .status(200)
      .json({ user: userDto, auth: true, token: accessToken });
  },
  async completeSignup(req, res, next) {
    const userRegisterSchema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword:Joi.ref("password")
    });

    const { error } = userRegisterSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const {
      email,
      password
      
    } = req.body;

    const userId = req.query.id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      const error = new Error("User not found!");
      error.status = 404;
      return next(error);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update only the provided fields
    existingUser.email = email;
    existingUser.password = hashedPassword;

    // Save the updated test
    await existingUser.save();

    return res
      .status(200)
      .json({
        message: "User updated successfully",
        user: existingUser,
      });
  },
  async logout(req, res, next) {
    const userId = req.user._id;
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    try {
      await RefreshToken.deleteOne({ userId });
    } catch (error) {
      return next(error);
    }
    try {
      await AccessToken.deleteOne({ token: accessToken });
    } catch (error) {
      return next(error);
    }

    // 2. response
    res.status(200).json({ user: null, auth: false });
  },

  }


  module.exports = userAuthController;