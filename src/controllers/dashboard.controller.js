import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  let statusData = {};

  const channelStatus = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },

    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "totalLikes",
      },
    },

    { $addFields: { totalLikes: { $size: "$totalLikes" } } },

    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
        totalLikes: { $sum: "$totalLikes" },
      },
    },
    { $project: { _id: 0 } },
  ]);

  statusData.totalSubscribers = await Subscription.countDocuments({
    channel: req.user._id,
  });

  statusData = { ...statusData, ...channelStatus[0] };

  return res
    .status(200)
    .json(
      new ApiResponse(200, statusData, "Total views fetched successfully!")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
  };

  const matchStage = {
    owner: new mongoose.Types.ObjectId(req.user._id),
  };

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

export { getChannelStats, getChannelVideos };
