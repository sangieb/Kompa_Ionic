/** Unique keys for everything stored in local storage. */
export const StorageKeys = {
  profile: 'perfil',
  accounts: 'cuentas',
  session: 'sesion',
  activities: 'actividades',
  posts: 'publicaciones',
  consent: 'consentimiento',
  locationRequested: 'ubicacionSolicitada',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export type ClaveAlmacenamiento = StorageKey;
