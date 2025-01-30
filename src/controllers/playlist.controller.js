import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (name.trim() == "" || description.trim() == "") {
    throw new ApiError(400, "Name and description are required !");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(501, "Unable to create playlist!");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist crated successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId!");
  }

  const userPlaylists = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { fullName: 1, userName: 1, avatar: 1, _id: 0 } },
        ],
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                { $project: { fullName: 1, userName: 1, avatar: 1, _id: 0 } },
              ],
            },
          },
          { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlist fetched successfully!")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId!");
  }

  const userPlaylists = await Playlist.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { fullName: 1, userName: 1, avatar: 1, _id: 0 } },
        ],
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                { $project: { fullName: 1, userName: 1, avatar: 1, _id: 0 } },
              ],
            },
          },
          { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlist fetched successfully!")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video Id !");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(501, "Unable to add video in playlist!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added into playlist!"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video Id !");
  }
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(501, "Unable to remove video from playlist!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed from playlist!"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findByIdAndDelete(playlistId);
  if (!playlist) {
    throw new ApiError(500, "Unable to delete playlist!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, [], "Playlist has been deleted successfully!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId!");
  }

  if (name.trim() == "" || description == "") {
    throw new ApiError(400, "Name and description are required !");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(501, "Unable to update playlist!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist update successfully!"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
