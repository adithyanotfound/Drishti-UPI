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
        // Cache API calls to your Render backend
        urlPattern: ({ url }) =>
          url.origin === "https://drishti-upi-service.onrender.com",
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Cache all images
        urlPattern: ({ request }) => request.destination === "image",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drishti-upi-service.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**", // Allow any CDN-hosted images
        pathname: "/**",
      },
    ],
  },
};

export default withPWANext(nextConfig);
