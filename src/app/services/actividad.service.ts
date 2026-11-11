import { Injectable } from '@angular/core';
import { AlmacenamientoService } from './almacenamiento.service';
import { Actividad } from '../models/actividad.model';
import { ACTIVIDADES_EJEMPLO } from '../data/actividades-ejemplo';

export interface FiltroActividades {
  texto?: string;
  origen?: string | null;
  duracionMinima?: number | null;
  duracionMaxima?: number | null;
}

/** Equivale a data/actividad/ActividadRepository.kt (parte local) */
@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly CLAVE = 'actividades';

  constructor(private almacenamiento: AlmacenamientoService) {}

  async obtenerLocales(): Promise<Actividad[]> {
    return ordenar(await this.todas());
  }

  /** Mismos filtros que la consulta SQL de Kotlin: cada filtro vacío se ignora. */
  async buscar(filtro: FiltroActividades = {}): Promise<Actividad[]> {
    const texto = (filtro.texto ?? '').trim().toLowerCase();
    const { origen, duracionMinima, duracionMaxima } = filtro;

    const resultado = (await this.todas()).filter((a) => {
      if (texto && !a.nombre.toLowerCase().includes(texto)
          && !a.ubicacion.toLowerCase().includes(texto)) return false;
      if (origen && a.origen !== origen) return false;
      if (duracionMinima != null && (a.duracionMin == null || a.duracionMin < duracionMinima)) return false;
      if (duracionMaxima != null && (a.duracionMin == null || a.duracionMin > duracionMaxima)) return false;
      return true;
    });
    return ordenar(resultado);
  }

  async guardarNueva(actividad: Actividad): Promise<void> {
    const lista = (await this.todas()).filter((a) => a.id !== actividad.id);
    lista.push(actividad);
    await this.almacenamiento.guardar(this.CLAVE, lista);
  }

  /** La primera vez guarda las actividades de ejemplo (como KompaDbHelper.onCreate). */
  private async todas(): Promise<Actividad[]> {
    if (!(await this.almacenamiento.existe(this.CLAVE))) {
      await this.almacenamiento.guardar(this.CLAVE, ACTIVIDADES_EJEMPLO);
      return [...ACTIVIDADES_EJEMPLO];
    }
    return this.almacenamiento.leer<Actividad[]>(this.CLAVE, []);
  }
}

/** ORDER BY fecha_creacion DESC, nombre ASC */
function ordenar(lista: Actividad[]): Actividad[] {
  return [...lista].sort((a, b) => {
    const fa = a.fechaCreacion ?? -Infinity;
    const fb = b.fechaCreacion ?? -Infinity;
    if (fa !== fb) return fb - fa;
    return a.nombre.localeCompare(b.nombre);
  });
}