import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    console.log("file is uploaded on cloudinary", uploadResult.secure_url);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("some error occure during uploding", error);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    await cloudinary.uploader.destroy(publicId);
    console.log("Old file is deleted successfully");
  } catch (error) {
    console.error("some error occure during deleting", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
