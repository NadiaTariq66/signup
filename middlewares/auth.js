const AccessToken= require("../models/accessToken");
const User= require("../models/User/user");
const JWTService = require("../services/JWTService");
const userDTO= require("../dto/user");



const auth = async (req,res,next)=>{
try {
        // 1. refresh, access token validation
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader && authHeader.split(" ")[1];
        const ifTokenExists = await AccessToken.find({ token: accessToken });
        if (ifTokenExists == "") {
          const error = {
            status: 401,
            message: "Unauthorized",
          };
          return next(error);
        }
    
        if (!accessToken) {
          const error = {
            status: 401,
            message: "Unauthorized",
          };
    
          return next(error);
        }
        let _id;
    
        try {
          _id = JWTService.verifyAccessToken(accessToken)._id;
        } catch (error) {
          return next(error);
        }
        let user;
        if (req.originalUrl.includes("/user")) {
          try {
            user = await User.findOne({ _id: _id });
          } catch (error) {
            return next(error);
          }
          const userDto = new userDTO(user);
    
          req.user = userDto;
    
          next();
          return;
        }
        
     else {
            const error = {
              status: 404,
              message: "Route not found",
            };
        
            return next(error);
        } 
    }
      catch (error) {
        return next(error);
      }
    };
    
    module.exports = auth;
    