/** Stored account information with salt and hashed password. */
export interface Account {
  email: string;
  salt: string;
  hash: string;
  correo?: string;
  sal?: string;
}
