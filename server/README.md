# Kompa API — servidor de autenticación y recuperación de contraseña

API mínima de Node/Express para el flujo de autenticación de Kompa: registro, login,
refresh, logout, recuperación de contraseña por correo con enlace de un solo uso y
cambio de contraseña.

## Requisitos

- Node.js 20+
- SQLite (base de datos por defecto `./data/kompa.db`)

## Instalación

```bash
cd server
npm install
cp .env.example .env
```

## Variables de entorno (`server/.env`)

Solo faltan los datos sensibles reales:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`: credenciales del
  proveedor de correo (Brevo, Resend, Mailtrap en desarrollo, Gmail con contraseña de
  aplicación, etc.).
- `APP_URL`: URL pública de la app donde se arma el enlace `/restablecer?token=…`.
- `JWT_SECRET`, `RESET_TOKEN_SECRET`: secretos largos y aleatorios.
- `CORS_ORIGIN`, `DATABASE_PATH`, `PORT`.

## Ejecución

```bash
npm run dev     # desarrollo con tsx
npm run build   # compila a dist/
npm run start   # ejecuta el build
npm test        # tests unitarios (vitest)
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servicio |
| `POST` | `/api/auth/registro` | Registra un correo con contraseña y emite tokens |
| `POST` | `/api/auth/login` | Autentica y emite tokens |
| `POST` | `/api/auth/refresh` | Renueva el access token con refresh token |
| `POST` | `/api/auth/logout` | Revoca el refresh token |
| `POST` | `/api/auth/recuperar` | Genera token y envía correo (respuesta 202 siempre) |
| `POST` | `/api/auth/restablecer` | Valida token y aplica nueva contraseña (200/400) |

## Flujo de recuperación

1. `POST /api/auth/recuperar` con `{ "correo": "..." }`.
2. Si el correo existe, el servidor crea un token opaco (SHA-256, TTL 30 min) y envía el
   correo con enlace a `${APP_URL}/restablecer?token=…`.
3. `POST /api/auth/restablecer` con `{ "token": "...", "password": "..." }`.
4. Al éxito se actualiza el hash de la contraseña (scrypt) y se invalida el token.

## Seguridad

- No se revela si un correo está registrado (`/recuperar` responde 202 genérico).
- Tokens de recuperación con hash SHA-256, un solo uso, expiración 30 min.
- Rate limit en `/api/auth` (60 peticiones / 15 min por IP).
- Contraseñas con hash scrypt (64 bytes) y sal aleatoria.
- Helmet + CORS restringido + body limit.
