/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ArcGIS SDK needs these transpilation settings
  transpilePackages: ['@arcgis/core'],
};

module.exports = nextConfig;
