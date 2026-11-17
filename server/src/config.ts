import { randomBytes } from 'node:crypto';

/**
 * Configuración de la API de Kompa. Se valida con Zod para fallar rápido
 * si falta un valor obligatorio en producción.
 */
export const config = {
  nodeEnv: (process.env.NODE_ENV ?? 'development') as 'development' | 'production',
  port: Number(process.env.PORT ?? 4000),
  appUrl: process.env.APP_URL ?? 'http://localhost:4200',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databasePath: process.env.DATABASE_PATH ?? './data/kompa.db',
  jwtSecret: process.env.JWT_SECRET ?? 'kompa-desarrollo-secreto-suficiente-32',
  jwtExpiracionMs: Number(process.env.JWT_EXPIRACION_MS ?? 900000),
  resetTokenTtlMs: Number(process.env.RESET_TOKEN_TTL_MS ?? 1800000),
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? 'Kompa <no-reply@tudominio.com>',
};

export { randomBytes };
