import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Guarda y lee datos en el dispositivo (equivale a Room / SharedPreferences).
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

  /**
   * Devuelve lo guardado o, la primera vez, siembra un valor inicial
   * (como onCreate de la base de datos en la app nativa). El valor sembrado
   * también sirve de respaldo si el JSON guardado queda corrupto.
   */
  async leerOSembrar<T>(clave: string, semilla: T): Promise<T> {
    if (!(await this.existe(clave))) {
      await this.guardar(clave, semilla);
      return semilla;
    }
    return this.leer<T>(clave, semilla);
  }
}
