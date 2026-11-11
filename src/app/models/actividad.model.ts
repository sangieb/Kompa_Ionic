// Equivale a data/actividad/Actividad.kt y ActividadOrigenes.kt
export const ORIGEN_LOCAL = 'local';
export const ORIGEN_API = 'api';

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  lat: number;
  lon: number;
  creadoPor: string;
  duracionMin: number | null;
  fechaCreacion: number | null;   // milisegundos, como fechaCreacionLong
  fechaActividad: number | null;  // milisegundos, como fechaActividadLong
  fotoRuta: string | null;
  origen: string;                 // ORIGEN_LOCAL u ORIGEN_API
}