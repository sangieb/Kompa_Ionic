/** Origin of an activity: created locally on the device or fetched from an API. */
export type ActivitySource = 'local' | 'api';
export type OrigenActividad = ActivitySource;

/** Activities created by the user on this device. */
export const LOCAL_SOURCE: ActivitySource = 'local';
export const ORIGEN_LOCAL: ActivitySource = 'local';

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: string;
  lat: number;
  lon: number;
  createdBy: string;
  durationMin: number | null;
  /** Milliseconds when created. */
  createdAt: number | null;
  /** Milliseconds when activity takes place. */
  activityDate: number | null;
  /** Compressed photo data URL or null. */
  photoPath: string | null;
  source: ActivitySource;

  nombre?: string;
  descripcion?: string;
  ubicacion?: string;
  creadoPor?: string;
  fechaCreacion?: number | null;
  fechaActividad?: number | null;
  fotoRuta?: string | null;
  origen?: ActivitySource;
}

export type Actividad = Activity;
