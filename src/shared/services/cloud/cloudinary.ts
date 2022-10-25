import { config } from "@root/config";
import cloudinary, {
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

export interface Params {
  folder: string;
  allowedFormats: string[];
}

export function upload(
  file: string,
  publicId?: string,
  overwrite?: boolean,
  invalidate?: boolean
): Promise<UploadApiResponse | UploadApiErrorResponse | undefined> {
  return new Promise((resolve) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        folder: config.CLOUDINARY_FOLDER,
        public_id: publicId,
        overwrite,
        invalidate,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          console.log(error);
          resolve(error);
        }
        resolve(result);
      }
    );
  });
}
