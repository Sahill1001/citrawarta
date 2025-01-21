import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (content.trim() === "") {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(500, "Tweet creation failed");
  }

  return res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user Id");
  }
  const tweet = await Tweet.find({ owner: userId });

  if (tweet.length === 0) {
    throw new ApiError(404, "No tweet found");
  }
  return res.status(200).json(new ApiResponse(200, tweet, "Tweets found"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    { content },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }
    
    const tweet = await Tweet.findByIdAndDelete({_id: tweetId});

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    retuen res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
