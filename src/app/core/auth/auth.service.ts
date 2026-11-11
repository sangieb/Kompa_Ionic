import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

import { CuentaService } from './cuenta.service';

/** Longitud mínima de la contraseña, como AuthConfig.MIN_PASSWORD_LEN */
export const MIN_PASSWORD_LEN = 6;

/** Resultado de intentar iniciar sesión. */
export enum ResultadoLogin {
  EXITO = 'EXITO',
  CUENTA_INEXISTENTE = 'CUENTA_INEXISTENTE',
  CONTRASENA_INCORRECTA = 'CONTRASENA_INCORRECTA',
}

interface Sesion {
  usuarioId: string;
  correo: string;
  accessToken: string;
  refreshToken: string;
  expiraEn: number;
}

const DURACION_ACCESO_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Sesión del usuario (equivale a AuthRepository + TokenStore).
 * Nota: los tokens son simulados porque no hay backend; una sesión real
 * debería validarse contra el servidor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly almacenamiento = inject(AlmacenamientoService);
  private readonly cuentas = inject(CuentaService);

  async login(correo: string, password: string): Promise<ResultadoLogin> {
    if (!correo.trim() || !password.trim() || password.length < MIN_PASSWORD_LEN) {
      return ResultadoLogin.CONTRASENA_INCORRECTA;
    }
    if (!(await this.cuentas.existe(correo))) {
      return ResultadoLogin.CUENTA_INEXISTENTE;
    }
    if (!(await this.cuentas.verificar(correo, password))) {
      return ResultadoLogin.CONTRASENA_INCORRECTA;
    }
    await this.crearSesion(correo);
    return ResultadoLogin.EXITO;
  }

  async crearSesion(correo: string): Promise<void> {
    const sesion: Sesion = {
      usuarioId: crypto.randomUUID(),
      correo,
      accessToken: `mock_access_${crypto.randomUUID()}`,
      refreshToken: `mock_refresh_${crypto.randomUUID()}`,
      expiraEn: Date.now() + DURACION_ACCESO_MS,
    };
    await this.almacenamiento.guardar(ClavesAlmacenamiento.sesion, sesion);
  }

  async sesionActiva(): Promise<boolean> {
    return this.almacenamiento.existe(ClavesAlmacenamiento.sesion);
  }

  async correoActual(): Promise<string | null> {
    const sesion = await this.almacenamiento.leer<Sesion | null>(ClavesAlmacenamiento.sesion, null);
    return sesion?.correo ?? null;
  }

  async logout(): Promise<void> {
    await this.almacenamiento.borrar(ClavesAlmacenamiento.sesion);
  }
}
