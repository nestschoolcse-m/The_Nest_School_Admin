import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next from inferring the wrong workspace root (common on Windows if
  // there are other lockfiles elsewhere on disk).
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
