/** Claves únicas para todo lo que se guarda en el almacenamiento local. */
export const ClavesAlmacenamiento = {
  perfil: 'perfil',
  cuentas: 'cuentas',
  sesion: 'sesion',
  actividades: 'actividades',
  publicaciones: 'publicaciones',
} as const;

export type ClaveAlmacenamiento = (typeof ClavesAlmacenamiento)[keyof typeof ClavesAlmacenamiento];
