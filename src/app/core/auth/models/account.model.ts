// La contraseña nunca se guarda: solo su sal y su hash.
export interface Cuenta {
  correo: string;
  sal: string;
  hash: string;
}
