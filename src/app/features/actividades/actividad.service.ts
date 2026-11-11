import { Injectable, inject } from '@angular/core';

import { AlmacenamientoService } from '../../core/storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../../core/storage/claves';
import { ACTIVIDADES_EJEMPLO } from '../../data/actividades-ejemplo';
import { ordenarPorFechaYNombre } from '../../shared/utils/ordenar';

import type { Actividad } from './models/actividad.model';

export interface FiltroActividades {
  texto?: string;
  origen?: string | null;
  duracionMinima?: number | null;
  duracionMaxima?: number | null;
}

/** Guarda y consulta las actividades creadas en el dispositivo. */
@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly almacenamiento = inject(AlmacenamientoService);

  async obtenerLocales(): Promise<Actividad[]> {
    return ordenar(await this.todas());
  }

  /** Cada filtro vacío se ignora (como la consulta SQL de la app nativa). */
  async buscar(filtro: FiltroActividades = {}): Promise<Actividad[]> {
    const texto = (filtro.texto ?? '').trim().toLowerCase();
    const { origen, duracionMinima, duracionMaxima } = filtro;

    const resultado = (await this.todas()).filter((a) => {
      if (texto && !a.nombre.toLowerCase().includes(texto) && !a.ubicacion.toLowerCase().includes(texto)) return false;
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
    await this.almacenamiento.guardar(ClavesAlmacenamiento.actividades, lista);
  }

  /** La primera vez siembra las actividades de ejemplo. */
  private async todas(): Promise<Actividad[]> {
    return [...(await this.almacenamiento.leerOSembrar(ClavesAlmacenamiento.actividades, ACTIVIDADES_EJEMPLO))];
  }
}

/** ORDER BY fecha_creacion DESC, nombre ASC */
function ordenar(lista: Actividad[]): Actividad[] {
  return ordenarPorFechaYNombre(
    lista,
    (a) => a.fechaCreacion,
    (a) => a.nombre,
  );
}
