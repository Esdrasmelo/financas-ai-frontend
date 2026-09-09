import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone: imagem Docker enxuta, sem node_modules completo.
  output: "standalone",
};

export default nextConfig;
