import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  serverExternalPackages: ['pdf-parse'],
  // Ensure proper build output for Vercel
  output: 'standalone',
};

export default nextConfig;
