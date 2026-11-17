import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Saves and reads data on the device (equivalent to Room / SharedPreferences).
 * Values are stored as JSON text.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const { value } = await Preferences.get({ key });
    if (value === null) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  async has(key: string): Promise<boolean> {
    const { value } = await Preferences.get({ key });
    return value !== null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  /**
   * Returns stored value or seeds an initial value on first read.
   * Also serves as fallback if the stored JSON is corrupted.
   */
  async getOrSeed<T>(key: string, seed: T): Promise<T> {
    const { value } = await Preferences.get({ key });
    if (value === null) {
      await this.set(key, seed);
      return seed;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      await this.set(key, seed);
      return seed;
    }
  }

  async leer<T>(clave: string, porDefecto: T): Promise<T> {
    return this.get(clave, porDefecto);
  }

  async existe(clave: string): Promise<boolean> {
    return this.has(clave);
  }

  async guardar<T>(clave: string, valor: T): Promise<void> {
    return this.set(clave, valor);
  }

  async borrar(clave: string): Promise<void> {
    return this.remove(clave);
  }

  async leerOSembrar<T>(clave: string, semilla: T): Promise<T> {
    return this.getOrSeed(clave, semilla);
  }
}
