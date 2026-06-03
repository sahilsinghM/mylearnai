import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/tutor", permanent: true },
      { source: "/plan",      destination: "/tutor", permanent: true },
      { source: "/proof",     destination: "/tutor", permanent: true },
      { source: "/proof-rail",destination: "/tutor", permanent: true },
    ];
  },
};

export default nextConfig;
