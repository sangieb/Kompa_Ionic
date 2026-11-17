import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface RespuestaAuth {
  estado?: string;
  error?: string;
}

/**
 * Cliente HTTP de la API de autenticación de Kompa (`server/`).
 * Si `environment.apis.auth` está vacío la app sigue en modo local.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  private get api(): string {
    return environment.apis.auth;
  }

  /** POST /api/auth/recuperar — envía el correo de recuperación (respuesta genérica). */
  async solicitarRecuperacion(correo: string): Promise<RespuestaAuth> {
    const respuesta = await firstValueFrom(this.http.post<RespuestaAuth>(`${this.api}/api/auth/recuperar`, { correo }));
    return respuesta;
  }

  /** POST /api/auth/restablecer — valida el token y aplica la nueva contraseña. */
  async restablecerContrasena(token: string, password: string): Promise<RespuestaAuth> {
    const respuesta = await firstValueFrom(
      this.http.post<RespuestaAuth>(`${this.api}/api/auth/restablecer`, { token, password }),
    );
    return respuesta;
  }
}
