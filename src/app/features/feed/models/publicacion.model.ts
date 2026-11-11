export interface Publicacion {
  id: string;
  titulo: string;
  cuerpo: string;
  autor: string;
  /** Milisegundos de cuando se creó, o null si no se sabe. */
  fechaCreacion: number | null;
  lat: number | null;
  lon: number | null;
}
