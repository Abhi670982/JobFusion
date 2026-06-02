import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  // Ensure proper build output for Vercel
  output: 'standalone',
};

export default nextConfig;
