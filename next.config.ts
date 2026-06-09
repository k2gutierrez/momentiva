import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mvsabrcqhpwenamlqcux.supabase.co',
        port: '',
      }
    ]
  },
  output: "standalone",
};

export default nextConfig;
