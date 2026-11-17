export const TEXTO_CORREO_RECUPERACION = (enlace: string): string =>
  [
    'Restablece tu contraseña en Kompa',
    '',
    'Hola,',
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
    'Para elegir una nueva contraseña, abre el siguiente enlace:',
    enlace,
    '',
    'Este enlace caduca en 30 minutos y solo puede usarse una vez.',
    'Si no solicitaste este cambio, ignora este correo: tu contraseña no se modificará.',
    '',
    'Equipo Kompa',
  ].join('\n');

export const HTML_CORREO_RECUPERACION = (enlace: string): string => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222">
      <h1 style="color: #5B2C83; font-size: 22px;">Restablece tu contraseña</h1>
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Kompa</strong>.</p>
      <p>Para elegir una nueva contraseña, haz clic en el siguiente botón:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${enlace}"
           style="background-color: #5B2C83; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Crear nueva contraseña
        </a>
      </p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all;"><a href="${enlace}">${enlace}</a></p>
      <p><strong>Este enlace caduca en 30 minutos y solo puede usarse una vez.</strong></p>
      <p>Si no solicitaste este cambio, ignora este correo: tu contraseña no se modificará.</p>
      <p>— Equipo Kompa</p>
    </div>
  `;
