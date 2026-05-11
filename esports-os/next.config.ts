import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin file-tracing root to this app to silence the multi-lockfile warning
  // (the Laravel monorepo above us also has a package-lock.json).
  outputFileTracingRoot: path.resolve(__dirname),

  images: {
    remotePatterns: [
      // Supabase Storage public URLs
      {
        protocol: "https",
        hostname: "tbuxtlbtjpoholcflmoy.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
