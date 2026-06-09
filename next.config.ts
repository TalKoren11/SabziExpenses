import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (avoids picking up a parent lockfile).
  turbopack: { root: __dirname },
};

export default nextConfig;
