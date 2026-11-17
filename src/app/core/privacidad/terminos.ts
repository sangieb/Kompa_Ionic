/**
 * Datos de la versión vigente de los Términos y Condiciones.
 * Al cambiar el texto legal se debe subir la versión para volver a pedir
 * la aceptación a los usuarios existentes.
 */
export const TERMINOS_VERSION = '1.0';
export const TERMINOS_FECHA_ISO = '2026-11-16';
export const TERMINOS_FECHA_TEXTO = '16 de noviembre de 2026';

/** Identificación del responsable del tratamiento (Ley 1581 de 2012). */
export const RESPONSABLE_DATOS = {
  nombre: 'Kompa — Universidad Surcolombiana',
  dependencia: 'Facultad de Ingeniería',
  direccion: 'Neiva, Huila, Colombia',
  correo: 'facingenieria@usco.edu.co',
} as const;
