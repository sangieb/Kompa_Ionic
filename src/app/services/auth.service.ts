import { Injectable } from '@angular/core';
import { AlmacenamientoService } from './almacenamiento.service';
import { CuentaService } from './cuenta.service';

/** Equivale a AuthConfig.MIN_PASSWORD_LEN */
export const MIN_PASSWORD_LEN = 6;

/** Equivale a enum class ResultadoLogin */
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

const DURACION_ACCESO_MS = 15 * 60 * 1000; // 15 minutos, como en Kotlin

/** Equivale a data/auth/session/AuthRepository.kt + TokenStore.kt */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CLAVE = 'sesion';

  constructor(
    private almacenamiento: AlmacenamientoService,
    private cuentas: CuentaService
  ) {}

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
    await this.almacenamiento.guardar(this.CLAVE, sesion);
  }

  sesionActiva(): Promise<boolean> {
    return this.almacenamiento.existe(this.CLAVE);
  }

  async correoActual(): Promise<string | null> {
    const sesion = await this.almacenamiento.leer<Sesion | null>(this.CLAVE, null);
    return sesion?.correo ?? null;
  }

  logout(): Promise<void> {
    return this.almacenamiento.borrar(this.CLAVE);
  }
}