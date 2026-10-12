/** @type {import('next').NextConfig} */
const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const u = new URL(backend)

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port || undefined },
      // Add your CDN / object storage host here, e.g. S3 or Cloudinary
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Sample photos (src/lib/media.ts). Remove once you use your own images.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
}
export default nextConfig
