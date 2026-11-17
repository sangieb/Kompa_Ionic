import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Abre (o crea) la base de datos SQLite y aplica el esquema base. */
export function abrirBaseDatos(ruta: string) {
  mkdirSync(dirname(ruta), { recursive: true });
  const db = new Database(ruta);
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      correo TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      creado_en INTEGER NOT NULL,
      actualizado_en INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      expira_en INTEGER NOT NULL,
      revocada_en INTEGER,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones (usuario_id);

    CREATE TABLE IF NOT EXISTS tokens_recuperacion (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expira_en INTEGER NOT NULL,
      usado_en INTEGER,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tokens_usuario ON tokens_recuperacion (usuario_id);
  `);
  return db;
}
