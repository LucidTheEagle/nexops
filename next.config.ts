import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // PGlite — WASM support for embedded Postgres in the browser
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Prevent PGlite from being bundled server-side
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@electric-sql/pglite",
      ];
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "lucidtheeagle",
  project: "javascript-nextjsnexops",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});