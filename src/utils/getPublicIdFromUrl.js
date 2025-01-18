export const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const publicId = parts[parts.length - 1].split(".")[0];
  return publicId;
};