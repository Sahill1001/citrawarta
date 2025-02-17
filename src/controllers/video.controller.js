import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPublicIdFromUrl } from "../utils/getPublicIdFromUrl.js";

import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
  };

  const matchStage = { isPublished: true };

  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const aggregate = Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { fullName: 1, userName: 1, avatar: 1 } }],
      },
    },
    {
      $unwind: "$owner",
    },
  ]);
  const videos = await Video.aggregatePaginate(aggregate, options);

  if (!videos) {
    throw new ApiError(501, "Unable to fetch videos!");
  }

  let statusCode = 200;
  let message = "Videos fetched successfully!";

  if (videos.docs.length < 1) {
    statusCode = 404;
    message = "No result found for the query!";
  }

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, videos, message));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (title?.trim() == "" || description?.trim() == "") {
    throw new ApiError(401, "Title and description is required!");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(401, "Video file is required!");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!thumbnailLocalPath) {
    throw new ApiError(401, "Thumbnail is required!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath, "video");

  if (!videoFile) {
    throw new ApiError(501, "Unable to upload video file!");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");
  if (!thumbnail) {
    throw new ApiError(501, "Unable to upload thumbnail!");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile.duration,
    owner: req.user._id,
    isPublished: true,
  });

  if (!video) {
    throw new ApiError(501, "Unable to publish video!");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video Id!");
  }

  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { fullName: 1, userName: 1, avatar: 1 } }],
      },
    },
    // {
    //   $addFields: {
    //     owner: { $arrayElemAt: ["$owner", 0] },
    //   },
    // },
    {
      $unwind: "$owner",
    },
  ]);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
  
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  console.log("Incoming Request Body:", req.body);
  console.log("Incoming Request Params:", req.params);

  const { title, description } = req.body;
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video Id!");
  }

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(401, "Title and description are required!");
  }

  console.log("Updating Video with ID:", videoId);

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title, description } },
    { new: true }
  );

  if (!video) {
    console.error("Video not found or update failed!");
    throw new ApiError(501, "Unable to update video!");
  }

  console.log("Updated Video:", video);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video Id!");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }
  deleteFromCloudinary(getPublicIdFromUrl(video.videoFile), "video");
  deleteFromCloudinary(getPublicIdFromUrl(video.thumbnail));
  await video.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, [], "Video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Invalid video Id!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, [], "Video publish status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
