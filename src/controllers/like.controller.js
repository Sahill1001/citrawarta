import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const videoLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (videoLike) {
    await Like.findByIdAndDelete(videoLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, [], "The video unlike successfully!"));
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, [], "The video liked successfully!"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (commentLike) {
    await Like.findByIdAndDelete(commentLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, [], "The comment unlike successfully!"));
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, [], "The comment liked successfully!"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const tweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (tweetLike) {
    await Like.findByIdAndDelete(tweetLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, [], "The tweet unlike successfully!"));
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, [], "The tweet liked successfully!"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    { $match: { likedBy: req.user._id } }, // Match likes by the user
    {
      $lookup: {
        from: "videos", // Lookup videos collection
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    { $unwind: "$videoDetails" }, // Unwind the videoDetails array
    {
      $lookup: {
        from: "users", // Lookup users collection for video owner
        localField: "videoDetails.owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" }, // Unwind the ownerDetails array
    {
      $project: {
        _id: 0,
        videoDetails: {
          _id: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          owner: {
            fullName: "$ownerDetails.fullName",
            userName: "$ownerDetails.userName",
            avatar: "$ownerDetails.avatar",
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
