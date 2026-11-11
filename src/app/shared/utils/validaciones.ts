const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return PATRON_CORREO.test(correo);
}
