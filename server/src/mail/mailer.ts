import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { TEXTO_CORREO_RECUPERACION, HTML_CORREO_RECUPERACION } from './templates/recuperacion';
import { config } from '../config';

export interface DatosCorreo {
  correo: string;
  nombre?: string;
  enlace: string;
}

/** Crea el transporter de SMTP a partir de las variables de entorno. */
export function crearTransporte(): Transporter {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  });
}

/** Envía el correo de recuperación de contraseña (HTML + texto plano). */
export async function enviarCorreoRecuperacion(datos: DatosCorreo): Promise<void> {
  const transportador = crearTransporte();

  await transportador.sendMail({
    from: config.mailFrom,
    to: datos.correo,
    subject: 'Restablece la contraseña de tu cuenta en Kompa',
    html: HTML_CORREO_RECUPERACION(datos.enlace),
    text: TEXTO_CORREO_RECUPERACION(datos.enlace),
  });
}

/** Envía un correo de verificación/registro (usado por el flujo de cuenta). */
export async function enviarCorreoBienvenida(correo: string): Promise<void> {
  const transportador = crearTransporte();
  await transportador.sendMail({
    from: config.mailFrom,
    to: correo,
    subject: 'Bienvenido a Kompa',
    text: 'Bienvenido a Kompa. Ya puedes iniciar sesión.',
    html: '<p>Bienvenido a Kompa.</p>',
  });
}
