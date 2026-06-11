import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ExcelJS usa APIs de Node; aseguramos que no se intente empaquetar para el cliente.
  serverExternalPackages: ["exceljs", "bcryptjs"],
};

export default nextConfig;
