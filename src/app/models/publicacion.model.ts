// Equivale a data/publicacion/Publicacion.kt
export interface Publicacion {
  id: string;
  titulo: string;
  cuerpo: string;
  autor: string;
  fechaCreacion: number | null;
  lat: number | null;
  lon: number | null;
}