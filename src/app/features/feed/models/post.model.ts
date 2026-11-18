export interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  /** Milliseconds timestamp when created, or null if unknown. */
  createdAt: number | null;
  lat: number | null;
  lon: number | null;

  titulo?: string;
  cuerpo?: string;
  autor?: string;
  fechaCreacion?: number | null;
}

export type Publicacion = Post;
