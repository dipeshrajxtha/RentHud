import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server root if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Database (PostgreSQL + PostGIS)
  // DATABASE_URL takes precedence over discrete DB_* variables when provided.
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('renthub_dev'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_SSL: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('false'),

  // Spatial Search Parameters (Architecture Spec Section 6.2)
  INITIAL_RADIUS_KM: z.coerce.number().positive().default(1),
  MAX_RADIUS_KM: z.coerce.number().positive().default(32),
  MIN_RESULTS_THRESHOLD: z.coerce.number().int().positive().default(3),
  RADIUS_MULTIPLIER: z.coerce.number().positive().default(2),

  // Google OAuth — must be the intended RentHub OAuth Client ID.
  // Used as the audience (aud) value when verifying incoming Google ID tokens.
  GOOGLE_CLIENT_ID: z.string().min(1).default('mock_google_client_id'),
  GOOGLE_CLIENT_SECRET: z.string().default('mock_google_client_secret'),
  GOOGLE_CALLBACK_URL: z.string().url().default('http://localhost:5000/api/auth/google/callback'),

  // JWT
  // JWT_EXPIRES_IN controls access token lifespan. Default is 15m (short-lived).
  JWT_SECRET: z.string().min(16).default('dev_jwt_secret_key_at_least_16_characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  // JWT_REFRESH_EXPIRES_IN controls stateless refresh token lifespan.
  // NOTE: Stateless refresh tokens cannot be individually revoked before expiry.
  // Deactivating the user account (is_active = false) is the authoritative kill-switch.
  // Refresh token rotation is NOT implemented in Day 4. See Phase 8 roadmap.
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_refresh_secret_key_at_least_16_chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Redis (reserved for Phase 8 — session revocation, rate limiting, chatbot state)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  // Storage
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760),

  // CORS — allowed client origin. CORS_ORIGIN takes precedence over CLIENT_URL.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');
    throw new Error(`[RentHub Config Error] Invalid environment configuration:\n${errorDetails}`);
  }

  return result.data;
}

export const env = loadConfig();

export const config = {
  server: {
    env: env.NODE_ENV,
    port: env.PORT,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    isDevelopment: env.NODE_ENV === 'development',
  },
  database: {
    connectionString: env.DATABASE_URL,
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
    },
  },
  spatial: {
    initialRadiusKm: env.INITIAL_RADIUS_KM,
    maxRadiusKm: env.MAX_RADIUS_KM,
    minResultsThreshold: env.MIN_RESULTS_THRESHOLD,
    radiusMultiplier: env.RADIUS_MULTIPLIER,
    radiusProgressionKm: [1, 2, 4, 8, 16, 32] as const,
  },
  auth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  storage: {
    uploadDir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  },
  cors: {
    // CORS_ORIGIN takes precedence over CLIENT_URL
    origin: env.CORS_ORIGIN !== 'http://localhost:5173' ? env.CORS_ORIGIN : env.CLIENT_URL,
  },
} as const;

export default config;
