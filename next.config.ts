import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudinary — resume & avatar uploads
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Clerk — user profile pictures
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
  // pdf-parse uses native Node.js modules that must not be bundled by webpack
  serverExternalPackages: ["pdf-parse", "mammoth"],

  // DO NOT set output: 'standalone' — Vercel manages its own output format.
  // Using 'standalone' on Vercel causes deployment failures.
};

export default nextConfig;
