// Equivale a data/perfil/Perfil.kt
export interface Perfil {
  nombre: string;
  correo: string;
  fechaNacimiento: string;
  nacionalidad: string;
  genero: string;
  conectar: string;
  idiomas: string;
  intereses: string;
  fotoUri: string | null;
}

export function perfilVacio(): Perfil {
  return {
    nombre: '',
    correo: '',
    fechaNacimiento: '',
    nacionalidad: '',
    genero: '',
    conectar: '',
    idiomas: '',
    intereses: '',
    fotoUri: null,
  };
}