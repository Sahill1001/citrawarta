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

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) {
      console.error("Error: Missing publicId");
      return null;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // Ensure correct resource type
    });

    if (result.result === "ok") {
      console.log(`✅ File deleted successfully: ${publicId}`);
      return result;
    } else {
      console.warn(`⚠️ File not found or not deleted: ${publicId}`, result);
      return result;
    }
  } catch (error) {
    console.error("❌ Error deleting from Cloudinary:", error);
    throw error; // Propagate error for better error handling
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
