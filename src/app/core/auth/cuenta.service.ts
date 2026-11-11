import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../storage/claves';

import type { Cuenta } from './models/cuenta.model';
import { verificarPassword } from './password-hash';
import type { PasswordHashData } from './password-hash';

/** Guarda las cuentas registradas en el dispositivo (equivale a CuentaStore). */
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  /** Registra (o reemplaza) la cuenta con la contraseña ya hasheada. */
  async registrar(correo: string, credenciales: PasswordHashData): Promise<void> {
    const cuentas = (await this.todas()).filter((c) => c.correo !== correo);
    cuentas.push({ correo, sal: credenciales.sal, hash: credenciales.hash });
    await this.almacenamiento.guardar(ClavesAlmacenamiento.cuentas, cuentas);
  }

  async existe(correo: string): Promise<boolean> {
    return (await this.todas()).some((c) => c.correo === correo);
  }

  async verificar(correo: string, password: string): Promise<boolean> {
    const cuenta = (await this.todas()).find((c) => c.correo === correo);
    if (!cuenta) return false;
    return verificarPassword(password, cuenta.sal, cuenta.hash);
  }

  private async todas(): Promise<Cuenta[]> {
    return this.almacenamiento.leer<Cuenta[]>(ClavesAlmacenamiento.cuentas, []);
  }
}
