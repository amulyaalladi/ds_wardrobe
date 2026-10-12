import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// Production services switch on only when their env vars are set,
// so local development keeps working exactly as before.
const redisUrl = process.env.REDIS_URL
const useRedis = process.env.NODE_ENV === "production" && Boolean(redisUrl)
const useS3 = Boolean(process.env.S3_BUCKET)

const modules: any[] = [
  { resolve: "./src/modules/review" },
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "./src/modules/razorpay",
          id: "razorpay", // provider id becomes pp_razorpay_razorpay
          options: {
            key_id: process.env.RAZORPAY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
            webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
          },
        },
      ],
    },
  },
]

if (useRedis) {
  modules.push(
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          { resolve: "@medusajs/caching-redis", id: "caching-redis", is_default: true, options: { redisUrl } },
        ],
      },
    },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl } } },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          { resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl } },
        ],
      },
    }
  )
}

// Product images uploaded in Admin. Cloud servers wipe their disk on every deploy,
// so in production images must live in object storage (Cloudflare R2, AWS S3, ...).
if (useS3) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL, // public URL of the bucket
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || "auto",
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT, // needed for R2; leave empty for AWS S3
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  modules,
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
})
