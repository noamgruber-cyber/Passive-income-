import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow any https image URL (covers Unsplash, Cloudinary, Supabase Storage, etc.)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
