const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable X-Powered-By header to reduce information disclosure
  poweredByHeader: false,

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

  serverExternalPackages: ["pdf-parse", "mammoth"],

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
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: "/auth/signin", destination: "/sign-in" },
      { source: "/auth/signup", destination: "/sign-up" },
    ];
  },

  experimental: {
    inlineCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
