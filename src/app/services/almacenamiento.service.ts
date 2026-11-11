import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Guarda y lee datos en el celular (equivale a Room / SharedPreferences).
 * Los valores se guardan como texto JSON.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoService {

  async leer<T>(clave: string, porDefecto: T): Promise<T> {
    const { value } = await Preferences.get({ key: clave });
    if (value === null) return porDefecto;
    try {
      return JSON.parse(value) as T;
    } catch {
      return porDefecto;
    }
  }

  async existe(clave: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: clave });
    return value !== null;
  }

  async guardar<T>(clave: string, valor: T): Promise<void> {
    await Preferences.set({ key: clave, value: JSON.stringify(valor) });
  }

  async borrar(clave: string): Promise<void> {
    await Preferences.remove({ key: clave });
  }
}