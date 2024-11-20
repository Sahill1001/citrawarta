import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request!");
    }

    // Verify token and decode payload
    const { _id } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch user from database excluding sensitive fields
    const user = await User.findById(_id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }

    // Attach user information to the request object
    req.user = user;

    next();
  } catch (error) {
    // Throw consistent error messages
    const message =
      error.name === "JsonWebTokenError"
        ? "Invalid Access Token!"
        : error.message;
    throw new ApiError(401, message);
  }
});
