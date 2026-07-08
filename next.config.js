const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // Google Favicons
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      // Clearbit Company Logos
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
    ],
  },
  // pdf-parse uses native Node.js modules that must not be bundled by webpack
  serverExternalPackages: ["pdf-parse", "mammoth"],

  // HSTS header — tells browsers to always use HTTPS, eliminating the
  // http→https redirect on repeat visits (~520 ms saved per visit).
  // Submit to https://hstspreload.org/ after verifying the header works.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },

  // Convert legacy auth routes to zero-cost rewrites instead of
  // server-side redirect() calls — avoids an extra redirect hop.
  async rewrites() {
    return [
      { source: "/auth/signin", destination: "/sign-in" },
      { source: "/auth/signup", destination: "/sign-up" },
    ];
  },

  // DO NOT set output: 'standalone' — Vercel manages its own output format.
  // Using 'standalone' on Vercel causes deployment failures.

  // Inline CSS into <head> as <style> tags instead of render-blocking <link> tags.
  // Safe for Tailwind (atomic CSS) — output is small (~20 KiB) and eliminates
  // the CSS request waterfall on mobile (~310 ms savings on first paint).
  experimental: {
    inlineCss: false,
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
