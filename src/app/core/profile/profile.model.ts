/** Información del usuario, tal como se llenó en el formulario de registro. */
export interface Perfil {
  nombre: string;
  correo: string;
  /** Fecha de nacimiento en formato "dd/MM/yyyy". */
  fechaNacimiento: string;
  nacionalidad: string;
  genero: string;
  /** Con quién quiere conectar (chips elegidos en el registro). */
  conectar: string[];
  /** Idiomas que habla. */
  idiomas: string[];
  /** Intereses elegidos (máximo 5 en el registro). */
  intereses: string[];
  /** Foto de perfil como data URL, o null si no subió ninguna. */
  fotoUri: string | null;
}

/**
 * Convierte un perfil guardado (incluso con el formato viejo, donde las
 * listas eran texto separado por comas) al formato actual con arreglos.
 */
export function normalizarPerfil(bruto: unknown): Perfil | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const datos = bruto as Partial<Perfil>;
  return {
    nombre: typeof datos.nombre === 'string' ? datos.nombre : '',
    correo: typeof datos.correo === 'string' ? datos.correo : '',
    fechaNacimiento: typeof datos.fechaNacimiento === 'string' ? datos.fechaNacimiento : '',
    nacionalidad: typeof datos.nacionalidad === 'string' ? datos.nacionalidad : '',
    genero: typeof datos.genero === 'string' ? datos.genero : '',
    conectar: aLista(datos.conectar),
    idiomas: aLista(datos.idiomas),
    intereses: aLista(datos.intereses),
    fotoUri: typeof datos.fotoUri === 'string' ? datos.fotoUri : null,
  };
}

/** Detecta el formato viejo: alguna lista guardada como texto con comas. */
export function esFormatoViejo(bruto: unknown): boolean {
  if (typeof bruto !== 'object' || bruto === null) return false;
  const datos = bruto as { conectar?: unknown; idiomas?: unknown; intereses?: unknown };
  return typeof datos.conectar === 'string' || typeof datos.idiomas === 'string' || typeof datos.intereses === 'string';
}

/** Acepta "A, B, C" o ["A", "B"] y devuelve la lista sin vacíos. */
function aLista(valor: unknown): string[] {
  if (Array.isArray(valor)) {
    return valor.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof valor === 'string') {
    return valor
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}
