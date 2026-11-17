/** Origen de una actividad: creada en el dispositivo o traída de una API. */
export type OrigenActividad = 'local' | 'api';

/** Actividades creadas por el usuario en este dispositivo. */
export const ORIGEN_LOCAL: OrigenActividad = 'local';

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  lat: number;
  lon: number;
  creadoPor: string;
  duracionMin: number | null;
  /** Milisegundos de cuando se creó. */
  fechaCreacion: number | null;
  /** Milisegundos de cuando ocurrirá la actividad. */
  fechaActividad: number | null;
  /** Foto comprimida como data URL, o null. */
  fotoRuta: string | null;
  origen: OrigenActividad;
}
