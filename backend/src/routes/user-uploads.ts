import { Router } from "express";
import multer from "multer";
import { requireUser } from "../middleware/jwt-auth";
import { cloudinaryReady, uploadBufferToCloudinary } from "../lib/media-upload";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"));
    }
    return cb(null, true);
  },
});

router.post("/", requireUser, async (req, res, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      upload.single("image")(req, res, (error) => (error ? reject(error) : resolve())),
    );

    if (!cloudinaryReady) {
      return res.status(500).json({ message: "Image storage is not configured." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder: "thirfy-avatars",
      resourceType: "image",
    });

    return res.json(uploaded);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Image too large. Max size is 8MB." });
      }
      return res.status(400).json({ message: "Please upload a valid image file." });
    }
    return next(error);
  }
});

export default router;
