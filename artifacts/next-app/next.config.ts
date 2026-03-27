import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH?.replace(/\/+$/, "") || "";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  allowedDevOrigins: ["*"],
  devIndicators: false,
  basePath: basePath || undefined,
};

export default nextConfig;
