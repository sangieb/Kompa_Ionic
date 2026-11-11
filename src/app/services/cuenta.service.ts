import { Injectable } from '@angular/core';
import { AlmacenamientoService } from './almacenamiento.service';
import { Cuenta } from '../models/cuenta.model';
import { hashPassword, verificarPassword } from '../core/password-hash';

/** Equivale a data/auth/cuenta/CuentaStore.kt */
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly CLAVE = 'cuentas';

  constructor(private almacenamiento: AlmacenamientoService) {}

  async registrar(correo: string, password: string): Promise<void> {
    const datos = await hashPassword(password);
    const cuentas = (await this.todas()).filter((c) => c.correo !== correo);
    cuentas.push({ correo, sal: datos.sal, hash: datos.hash });
    await this.almacenamiento.guardar(this.CLAVE, cuentas);
  }

  async existe(correo: string): Promise<boolean> {
    return (await this.todas()).some((c) => c.correo === correo);
  }

  async verificar(correo: string, password: string): Promise<boolean> {
    const cuenta = (await this.todas()).find((c) => c.correo === correo);
    if (!cuenta) return false;
    return verificarPassword(password, cuenta.sal, cuenta.hash);
  }

  private todas(): Promise<Cuenta[]> {
    return this.almacenamiento.leer<Cuenta[]>(this.CLAVE, []);
  }
}