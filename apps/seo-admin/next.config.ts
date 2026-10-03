import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['ui', 'editor-protocol', 'shared-types', 'backend'],
};

export default nextConfig;
