import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { abrirBaseDatos } from './db';
import { crearRouter } from './auth/rutas';
import { health } from './auth/salud';

export function crearApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(express.json({ limit: '16kb' }));

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

  const api = express.Router();
  api.use(limiter);
  api.use('/auth', crearRouter(abrirBaseDatos(process.env.DATABASE_PATH ?? './data/kompa.db')));
  app.use('/api', api);

  app.get('/health', health);

  return app;
}

const app = crearApp();

const servidor = app.listen(Number(process.env.PORT ?? 4000), () => {
  console.log(`Kompa API escuchando en el puerto ${process.env.PORT ?? 4000}`);
});

process.on('SIGTERM', () => servidor.close(() => process.exit(0)));
process.on('SIGINT', () => servidor.close(() => process.exit(0)));
