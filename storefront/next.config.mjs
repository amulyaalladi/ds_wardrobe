/** @type {import('next').NextConfig} */

/** Accepts "api.example.com", "https://api.example.com/", or values with stray quotes/spaces. */
function normalizeUrl(raw, fallback) {
  let v = String(raw ?? "").trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "")
  if (!v) return fallback
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`
  try {
    return new URL(v).origin
  } catch {
    console.warn(`NEXT_PUBLIC_MEDUSA_BACKEND_URL is not a valid URL ("${raw}"). Using ${fallback}.`)
    return fallback
  }
}

const backend = normalizeUrl(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, "http://localhost:9000")

// On Vercel, a missing value silently points the live site at localhost. Fail the build instead.
if (process.env.VERCEL) {
  console.log(`Storefront will call the Medusa backend at: ${backend}`)
  const problems = []
  if (backend.includes("localhost")) {
    problems.push(`NEXT_PUBLIC_MEDUSA_BACKEND_URL is missing or invalid (got: "${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? ""}")`)
  }
  if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim().startsWith("pk_")) {
    problems.push("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is missing or does not start with pk_")
  }
  if (problems.length) {
    throw new Error(
      `\n\nStorefront config problem (${process.env.VERCEL_ENV} build):\n- ${problems.join("\n- ")}\n` +
        "Fix it in Vercel > Settings > Environment Variables (tick Production), then redeploy without build cache.\n"
    )
  }
}
const u = new URL(backend)

const nextConfig = {
  // Make the cleaned-up value the one the app sees too.
  env: { NEXT_PUBLIC_MEDUSA_BACKEND_URL: backend },
  images: {
    remotePatterns: [
      { protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port || undefined },
      // Add your CDN / object storage host here, e.g. S3 or Cloudinary
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Cloudflare R2 public buckets (product images uploaded in Admin)
      { protocol: "https", hostname: "**.r2.dev" },
      // Sample photos (src/lib/media.ts). Remove once you use your own images.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
}
export default nextConfig
