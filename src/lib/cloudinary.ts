import { v2 as cloudinary } from "cloudinary";

// Cloudinary is configured lazily inside functions — the config() call here is
// safe because it only sets values; it does NOT make any network requests at
// module evaluation time. Vercel build will not fail even when the env-vars
// are absent (they just stay undefined until the function runs).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;