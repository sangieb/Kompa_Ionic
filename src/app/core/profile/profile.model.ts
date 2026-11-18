/** User profile information as entered in the registration form. */
export interface Profile {
  name: string;
  email: string;
  /** Birth date in "dd/MM/yyyy" format. */
  birthDate: string;
  nationality: string;
  gender: string;
  /** Who the user wants to connect with. */
  connectWith: string[];
  /** Languages spoken. */
  languages: string[];
  /** Selected interests. */
  interests: string[];
  /** Profile photo as data URL, or null if none uploaded. */
  photoUri: string | null;

  nombre?: string;
  correo?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  genero?: string;
  conectar?: string[];
  idiomas?: string[];
  intereses?: string[];
}

/**
 * Normalizes stored profile data (including legacy format where lists were comma-separated strings).
 */
export function normalizeProfile(raw: unknown): Profile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;

  const name = String(data['name'] ?? data['nombre'] ?? '');
  const email = String(data['email'] ?? data['correo'] ?? '');
  const birthDate = String(data['birthDate'] ?? data['fechaNacimiento'] ?? '');
  const nationality = String(data['nationality'] ?? data['nacionalidad'] ?? '');
  const gender = String(data['gender'] ?? data['genero'] ?? '');
  const connectWith = toList(data['connectWith'] ?? data['conectar']);
  const languages = toList(data['languages'] ?? data['idiomas']);
  const interests = toList(data['interests'] ?? data['intereses']);
  const photoUri = typeof data['photoUri'] === 'string' ? data['photoUri'] : null;

  return {
    name,
    email,
    birthDate,
    nationality,
    gender,
    connectWith,
    languages,
    interests,
    photoUri,
    // Provide Spanish aliases
    nombre: name,
    correo: email,
    fechaNacimiento: birthDate,
    nacionalidad: nationality,
    genero: gender,
    conectar: connectWith,
    idiomas: languages,
    intereses: interests,
  };
}

export const normalizarPerfil = normalizeProfile;

/** Detects legacy format: any list saved as comma-separated string. */
export function isLegacyFormat(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const data = raw as Record<string, unknown>;
  return (
    typeof data['connectWith'] === 'string' ||
    typeof data['conectar'] === 'string' ||
    typeof data['languages'] === 'string' ||
    typeof data['idiomas'] === 'string' ||
    typeof data['interests'] === 'string' ||
    typeof data['intereses'] === 'string'
  );
}

export const esFormatoViejo = isLegacyFormat;

/** Converts "A, B, C" or ["A", "B"] into a clean list of trimmed strings. */
export function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return [];
}
