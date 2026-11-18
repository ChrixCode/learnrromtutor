import dotenv from 'dotenv';
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@2tors.com',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    defaultProvider: process.env.AI_PROVIDER || 'mock',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  zoom: {
    apiKey: process.env.ZOOM_API_KEY,
    apiSecret: process.env.ZOOM_API_SECRET,
    webhookSecret: process.env.ZOOM_WEBHOOK_SECRET,
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  features: {
    aiTutor: process.env.ENABLE_AI_TUTOR === 'true',
    creatorStudio: process.env.ENABLE_CREATOR_STUDIO === 'true',
    teacherCopilot: process.env.ENABLE_TEACHER_COPILOT === 'true',
    schools: process.env.ENABLE_SCHOOLS === 'true',
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'],
  },
};

export default config;