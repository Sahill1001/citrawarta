import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const userRegister = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const userExist = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (userExist) {
    throw new ApiError(409, "The user already exist!");
  }

  const avtarLocalPath = req.files?.avtar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avtar is required!");
  }

  const avtar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avtar) {
    throw new ApiError(500, "Unabled to upload avtar!");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
    avtar: avtar.secure_url,
    coverImage: coverImage.secure_url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (createdUser) {
    return res
      .status(201)
      .json(
        new ApiResponse(200, createdUser.toJSON(), "User created successfully!")
      );
  }
});

export { userRegister };
