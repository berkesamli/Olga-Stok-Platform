/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    IKAS_CLIENT_ID: process.env.IKAS_CLIENT_ID,
    IKAS_CLIENT_SECRET: process.env.IKAS_CLIENT_SECRET,
    IKAS_STORE_NAME: process.env.IKAS_STORE_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
};

module.exports = nextConfig;
