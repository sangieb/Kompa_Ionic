// Equivale a data/catalogo/CatalogosSemilla.kt
// En Kotlin cada valor tenía un "orden"; aquí el orden es la posición en el arreglo.
export interface Catalogos {
  nacionalidades: string[];
  idiomas: string[];
  intereses: string[];
}

export const CATALOGOS_SEMILLA: Catalogos = {
  intereses: [
    'Senderismo', 'Playa', 'Mochilero', 'Gastronomía', 'Fotografía',
    'Vida nocturna', 'Museos y cultura', 'Deportes extremos', 'Yoga',
    'Café y trabajo remoto', 'Compras', 'Naturaleza', 'Fiestas locales',
    'Buceo', 'Road trips',
  ],
  nacionalidades: [
    'Mexicana/o', 'Colombiana/o', 'Argentina/o', 'Chilena/o', 'Peruana/o',
    'Española/o', 'Estadounidense', 'Brasileña/o', 'Ecuatoriana/o', 'Otro/Otra',
  ],
  idiomas: [
    'Español', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Otro',
  ],
};