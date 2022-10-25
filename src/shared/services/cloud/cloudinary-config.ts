import { CloudinaryStorage } from "multer-storage-cloudinary";
require("dotenv").config();

import cloudinary from "cloudinary";

interface ICloudinary {
  cloud_name: string | undefined;
  api_key: string | undefined;
  api_secret: string | undefined;
}
interface Params {
  folder: string;
  allowedFormats: string[];
}

const cloudConfig: ICloudinary = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const params: Params = {
  folder: "chatty",
  allowedFormats: ["png", "jpg", "jpeg"],
};
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: params,
});
