import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../middleware/auth";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/", requireAdmin, upload.single("image"), async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: "Cloudinary not configured" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "thirfy-products",
      resource_type: "auto",
    });

    return res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    return next(error);
  }
});

export default router;
