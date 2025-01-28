import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id");
  }
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  if (isSubscribed) {
    await Subscription.findByIdAndDelete({ _id: isSubscribed._id });
    return res.json(new ApiResponse(200, [], "Unsubscribed successfully"));
  } else {
    await Subscription.create({ subscriber: req.user._id, channel: channelId });
    return res.json(new ApiResponse(200, [], "Subscribed successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const subscribers = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [{ $project: { fullName: 1, userName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$subscribers" },
    {
      $replaceRoot: { newRoot: "$subscribers" },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Subscribers list is fetched successfully!"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber Id!");
  }

  const channels = await Subscription.aggregate([
    { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
        pipeline: [{ $project: { fullName: 1, userName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$channels" },
    { $replaceRoot: { newRoot: "$channels" } },
  ]);
  return res.status(200).json(new ApiResponse(200,channels,"Channels fetched successfully!"))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
