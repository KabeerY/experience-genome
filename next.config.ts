import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/capture": ["./node_modules/playwright-core/**/*"],
  },
};

export default nextConfig;
