import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.htmlgames.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.htmlgames.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.playsaurus.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.gamemonetize.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.onlinegames.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
