import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id!");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const aggregate = Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { fullName: 1, userName: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$owner" },
    { $project: { video: 0, _id: 0 } },
  ]);

  const comments = await Comment.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully!"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { comment } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId!");
  }

  if (comment.trim() == "") {
    throw new ApiError(400, "Comment can not be empty!");
  }

  const content = await Comment.create({
    content: comment,
    video: videoId,
    owner: req.user._id,
  });

  if (!content) {
    throw new ApiError(501, "Sorry unable to create the comment!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, content, "Comment is created successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId!");
  }

  if (comment.trim() == "") {
    throw new ApiError(400, "Comment can not be empty!");
  }

  const content = await Comment.findByIdAndUpdate(
    { _id: commentId },
    {
      $set: { content: comment },
    },
    { new: true }
  ).select("-video -owner");

  if (!content) {
    throw new ApiError(500, "The comment could not be Updated!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        content,
        "The comment has been uodated successfully!"
      )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId!");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment) {
    throw new ApiError(200, "could not be deleted the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, [], "Comment deleted successfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
