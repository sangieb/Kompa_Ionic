import type { Database } from 'better-sqlite3';
import { Router, type Request, type Response } from 'express';

import { enviarCorreoBienvenida, enviarCorreoRecuperacion } from '../mail/mailer';
import { hashPassword, verificarPassword, type PasswordHashData } from './passwords';
import { requireAuth } from './middleware';
import { crearTokenAcceso, crearTokenRefresh } from './tokens';
import { crearTokenRecuperacion, hashToken } from './tokens-recuperacion';

const MIN_PASSWORD_LEN = 6;

export function crearRouter(db: Database) {
  const router = Router();

  // ---------- Registro ----------
  router.post('/registro', async (req: Request, res: Response) => {
    const correo = String(req.body?.correo ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!correo || !password || password.length < MIN_PASSWORD_LEN) {
      res.status(400).json({ error: 'DATOS_INVALIDOS' });
      return;
    }

    const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
    if (existe) {
      res.status(409).json({ error: 'CORREO_REGISTRADO' });
      return;
    }

    const hash: PasswordHashData = await hashPassword(password);
    const ahora = Date.now();
    const idUsuario = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(
      'INSERT INTO usuarios (id, correo, password_hash, salt, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(idUsuario, correo, hash.hash, hash.salt, ahora, ahora);

    const tokenAcceso = crearTokenAcceso({ id: idUsuario, correo });
    const tokenRefresh = crearTokenRefresh();
    db.prepare(
      'INSERT INTO sesiones (id, usuario_id, refresh_token_hash, expira_en, revocada_en) VALUES (?, ?, ?, ?, NULL)',
    ).run(
      `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      idUsuario,
      tokenRefresh.token,
      tokenRefresh.expiraEn,
      null,
    );

    await enviarCorreoBienvenida(correo);

    res.status(201).json({ estado: 'creado', token: tokenAcceso.token, refreshToken: tokenRefresh.token });
  });

  // ---------- Login ----------
  router.post('/login', async (req: Request, res: Response) => {
    const correo = String(req.body?.correo ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? '');

    const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo) as
      { id: string; correo: string; password_hash: string; salt: string } | undefined;

    if (!usuario || !verificarPassword(password, { salt: usuario.salt, hash: usuario.password_hash })) {
      res.status(401).json({ error: 'CREDENCIALES_INVALIDAS' });
      return;
    }

    const tokenAcceso = crearTokenAcceso({ id: usuario.id, correo: usuario.correo });
    const tokenRefresh = crearTokenRefresh();
    db.prepare(
      'INSERT INTO sesiones (id, usuario_id, refresh_token_hash, expira_en, revocada_en) VALUES (?, ?, ?, ?, NULL)',
    ).run(
      `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      usuario.id,
      tokenRefresh.token,
      tokenRefresh.expiraEn,
      null,
    );

    res.status(200).json({ estado: 'ok', token: tokenAcceso.token, refreshToken: tokenRefresh.token });
  });

  // ---------- Refresh ----------
  router.post('/refresh', async (req: Request, res: Response) => {
    const refreshToken = String(req.body?.refreshToken ?? '');
    const sesion = db.prepare('SELECT * FROM sesiones WHERE refresh_token_hash = ?').get(refreshToken) as
      { id: string; usuario_id: string; expira_en: number; revocada_en: number | null } | undefined;

    if (!sesion || sesion.revocada_en !== null || sesion.expira_en < Date.now()) {
      res.status(401).json({ error: 'REFRESH_INVALIDO' });
      return;
    }

    const usuario = db.prepare('SELECT id, correo FROM usuarios WHERE id = ?').get(sesion.usuario_id) as
      { id: string; correo: string } | undefined;

    if (!usuario) {
      res.status(401).json({ error: 'REFRESH_INVALIDO' });
      return;
    }

    const tokenAcceso = crearTokenAcceso(usuario);
    const tokenRefresh = crearTokenRefresh();
    db.prepare('UPDATE sesiones SET refresh_token_hash = ?, expira_en = ? WHERE id = ?').run(
      tokenRefresh.token,
      tokenRefresh.expiraEn,
      sesion.id,
    );

    res.status(200).json({ estado: 'ok', token: tokenAcceso.token, refreshToken: tokenRefresh.token });
  });

  // ---------- Logout ----------
  router.post('/logout', async (req: Request, res: Response) => {
    const refreshToken = String(req.body?.refreshToken ?? '');
    db.prepare('UPDATE sesiones SET revocada_en = ? WHERE refresh_token_hash = ?').run(Date.now(), refreshToken);
    res.status(204).json({ estado: 'ok' });
  });

  // ---------- Usuario actual ----------
  router.get('/yo', requireAuth, (req: Request, res: Response) => {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }
    res.status(200).json({ estado: 'ok', usuario });
  });

  // ---------- Recuperación de contraseña ----------
  router.post('/recuperar', async (req: Request, res: Response) => {
    const correo = String(req.body?.correo ?? '')
      .trim()
      .toLowerCase();
    const usuario = db.prepare('SELECT id, correo FROM usuarios WHERE correo = ?').get(correo) as
      { id: string; correo: string } | undefined;

    if (usuario) {
      const { token, expiraEn } = crearTokenRecuperacion();
      db.prepare(
        'INSERT INTO tokens_recuperacion (id, usuario_id, token_hash, expira_en, usado_en) VALUES (?, ?, ?, ?, NULL)',
      ).run(`tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, usuario.id, hashToken(token), expiraEn);
      const enlace = `${process.env.APP_URL ?? ''}/restablecer?token=${token}`;
      await enviarCorreoRecuperacion({ correo: usuario.correo, enlace });
    }

    res.status(202).json({ estado: 'enviado' });
  });

  // ---------- Restablecer contraseña ----------
  router.post('/restablecer', async (req: Request, res: Response) => {
    const token = String(req.body?.token ?? '');
    const password = String(req.body?.password ?? '');
    const tokenHash = hashToken(token);

    const tokenRow = db
      .prepare('SELECT id, usuario_id, expira_en, usado_en FROM tokens_recuperacion WHERE token_hash = ?')
      .get(tokenHash) as { id: string; usuario_id: string; expira_en: number; usado_en: number | null } | undefined;

    if (!tokenRow || tokenRow.usado_en !== null || tokenRow.expira_en < Date.now()) {
      res.status(400).json({ error: 'TOKEN_INVALIDO' });
      return;
    }

    const contrasenaValida = password.length >= MIN_PASSWORD_LEN;
    if (!contrasenaValida) {
      res.status(400).json({ error: 'CONTRASENA_INVALIDA' });
      return;
    }

    const hash = await hashPassword(password);
    db.prepare('UPDATE usuarios SET password_hash = ?, salt = ?, actualizado_en = ? WHERE id = ?').run(
      hash.hash,
      hash.salt,
      Date.now(),
      tokenRow.usuario_id,
    );
    db.prepare('UPDATE tokens_recuperacion SET usado_en = ? WHERE id = ?').run(Date.now(), tokenRow.id);

    res.status(200).json({ estado: 'ok' });
  });

  return router;
}
