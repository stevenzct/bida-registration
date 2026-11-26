import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  turbopack: { root: __dirname },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/registered.html", destination: "/registered", permanent: false },
    ];
  },
};

export default config;
