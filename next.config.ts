import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  turbopack: { root: __dirname },
  async headers() {
    return [{
      source: "/admin/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/registered.html", destination: "/registered", permanent: false },
    ];
  },
};

export default config;
