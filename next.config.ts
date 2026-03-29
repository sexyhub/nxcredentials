import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  allowedDevOrigins: ["*"],
  devIndicators: false,
};

export default nextConfig;
