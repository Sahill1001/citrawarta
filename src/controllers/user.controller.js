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

  const avtarLocalPath = req.files?.avtar?.[0]?.path;
  const coverImageLocalPath =
    req.files?.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
      ? req.files.coverImage[0].path
      : null;

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar is required!");
  }

  // Upload avatar
  const avtar = await uploadOnCloudinary(avtarLocalPath);
  if (!avtar) {
    throw new ApiError(500, "Unable to upload avatar!");
  }

  // Upload cover image if provided
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // Create the user
  const user = await User.create({
    userName: userName.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
    avtar: avtar.secure_url,
    coverImage: coverImage?.secure_url || "", // Fallback to an empty string if coverImage is not uploaded
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Somthing went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser.toJSON(), "User created successfully!")
    );
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const userLogin = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "userName or email is required !");
  }

  const user = await User.findOne({ $or: [{ userName }, { email }] });

  if (!user) {
    throw new ApiError(
      404,
      "User does not exist please try with a valid credentials !"
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In successfully !"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: "" },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out successfully! "));
});

export { userRegister, userLogin, userLogout };
