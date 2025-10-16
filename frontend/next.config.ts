import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const withPWANext = withPWA({
  dest: "public",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.origin.includes("localhost"),
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "*",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*",
        pathname: "/**",
      },
    ],
  },
};

export default withPWANext(nextConfig);
