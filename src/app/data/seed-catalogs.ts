export interface Catalogs {
  nationalities: string[];
  languages: string[];
  interests: string[];
  nacionalidades?: string[];
  idiomas?: string[];
  intereses?: string[];
}

export type Catalogos = Catalogs;

export const SEED_CATALOGS: Catalogs = {
  interests: [
    'Senderismo',
    'Playa',
    'Mochilero',
    'Gastronomía',
    'Fotografía',
    'Vida nocturna',
    'Museos y cultura',
    'Deportes extremos',
    'Yoga',
    'Café y trabajo remoto',
    'Compras',
    'Naturaleza',
    'Fiestas locales',
    'Buceo',
    'Road trips',
  ],
  nationalities: [
    'Mexicana/o',
    'Colombiana/o',
    'Argentina/o',
    'Chilena/o',
    'Peruana/o',
    'Española/o',
    'Estadounidense',
    'Brasileña/o',
    'Ecuatoriana/o',
    'Otro/Otra',
  ],
  languages: ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Otro'],
};

// Populate compatibility fields
SEED_CATALOGS.nacionalidades = SEED_CATALOGS.nationalities;
SEED_CATALOGS.idiomas = SEED_CATALOGS.languages;
SEED_CATALOGS.intereses = SEED_CATALOGS.interests;

export const CATALOGOS_SEMILLA = SEED_CATALOGS;

/** Gender options during registration (optional field). */
export const GENDERS = ['Mujer', 'Hombre', 'No binario', 'Prefiero no decirlo'] as const;
export const GENEROS = GENDERS;

/** Connection options during registration. */
export const CONNECT_OPTIONS = ['Mujeres', 'Hombres', 'Todes'] as const;
export const OPCIONES_CONECTAR = CONNECT_OPTIONS;
