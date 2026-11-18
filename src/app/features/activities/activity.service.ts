import { Injectable, inject } from '@angular/core';

import { StorageKeys } from '../../core/storage/storage-keys';
import { StorageService } from '../../core/storage/storage.service';
import { SAMPLE_ACTIVITIES } from '../../data/sample-activities';
import { sortByDateAndName } from '../../shared/utils/sort';

import type { Activity } from './models/activity.model';

export interface ActivityFilter {
  text?: string;
  source?: string | null;
  minDuration?: number | null;
  maxDuration?: number | null;

  texto?: string;
  origen?: string | null;
  duracionMinima?: number | null;
  duracionMaxima?: number | null;
}

export type FiltroActividades = ActivityFilter;

/** Saves and queries activities on device. */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly storage = inject(StorageService);

  async getLocal(): Promise<Activity[]> {
    return sortActivities(await this.getAll());
  }

  async search(filter: ActivityFilter = {}): Promise<Activity[]> {
    const text = (filter.text ?? filter.texto ?? '').trim().toLowerCase();
    const source = filter.source ?? filter.origen;
    const minDuration = filter.minDuration ?? filter.duracionMinima;
    const maxDuration = filter.maxDuration ?? filter.duracionMaxima;

    const result = (await this.getAll()).filter((a) => {
      const name = (a.name ?? a.nombre ?? '').toLowerCase();
      const location = (a.location ?? a.ubicacion ?? '').toLowerCase();
      const actSource = a.source ?? a.origen;
      const duration = a.durationMin;

      if (text && !name.includes(text) && !location.includes(text)) return false;
      if (source && actSource !== source) return false;
      if (minDuration != null && (duration == null || duration < minDuration)) return false;
      if (maxDuration != null && (duration == null || duration > maxDuration)) return false;
      return true;
    });

    return sortActivities(result);
  }

  async saveNew(activity: Activity): Promise<void> {
    const list = (await this.getAll()).filter((a) => a.id !== activity.id);
    list.push({
      ...activity,
      name: activity.name ?? activity.nombre ?? '',
      description: activity.description ?? activity.descripcion ?? '',
      location: activity.location ?? activity.ubicacion ?? '',
      createdBy: activity.createdBy ?? activity.creadoPor ?? '',
      createdAt: activity.createdAt ?? activity.fechaCreacion ?? Date.now(),
      activityDate: activity.activityDate ?? activity.fechaActividad ?? null,
      photoPath: activity.photoPath ?? activity.fotoRuta ?? null,
      source: activity.source ?? activity.origen ?? 'local',
      nombre: activity.name ?? activity.nombre ?? '',
      descripcion: activity.description ?? activity.descripcion ?? '',
      ubicacion: activity.location ?? activity.ubicacion ?? '',
      creadoPor: activity.createdBy ?? activity.creadoPor ?? '',
      fechaCreacion: activity.createdAt ?? activity.fechaCreacion ?? Date.now(),
      fechaActividad: activity.activityDate ?? activity.fechaActividad ?? null,
      fotoRuta: activity.photoPath ?? activity.fotoRuta ?? null,
      origen: activity.source ?? activity.origen ?? 'local',
    });
    await this.storage.set(StorageKeys.activities, list);
  }

  async getAll(): Promise<Activity[]> {
    return [...(await this.storage.getOrSeed(StorageKeys.activities, SAMPLE_ACTIVITIES))];
  }

  async obtenerLocales(): Promise<Activity[]> {
    return this.getLocal();
  }

  async buscar(filtro: ActivityFilter = {}): Promise<Activity[]> {
    return this.search(filtro);
  }

  async guardarNueva(actividad: Activity): Promise<void> {
    return this.saveNew(actividad);
  }

  async todas(): Promise<Activity[]> {
    return this.getAll();
  }
}

function sortActivities(list: Activity[]): Activity[] {
  return sortByDateAndName(
    list,
    (a) => a.createdAt ?? a.fechaCreacion ?? null,
    (a) => a.name ?? a.nombre ?? '',
  );
}
