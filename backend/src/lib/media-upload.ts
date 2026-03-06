import { v2 as cloudinary } from "cloudinary";

const cleanEnv = (value?: string) => value?.trim().replace(/^['"]|['"]$/g, "");

const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export const cloudinaryReady = Boolean(cloudName && apiKey && apiSecret);

type UploadParams = {
  buffer: Buffer;
  folder: string;
  resourceType: "image" | "auto";
};

export const uploadBufferToCloudinary = async ({
  buffer,
  folder,
  resourceType,
}: UploadParams): Promise<{ url: string; publicId: string }> => {
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, uploadResult) => {
        if (error) {
          return reject(error);
        }
        if (!uploadResult?.secure_url || !uploadResult?.public_id) {
          return reject(new Error("Invalid upload response"));
        }
        return resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
};
