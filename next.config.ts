import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // turbpacks/Next 16 manages minification; remove swcMinify to avoid warnings
  // swcMinify: true,
};

module.exports = withBundleAnalyzer(nextConfig);
