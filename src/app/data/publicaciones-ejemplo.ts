import { Publicacion } from '../models/publicacion.model';

/** Publicaciones iniciales del feed (como ActividadesEjemplo, pero para el feed) */
export const PUBLICACIONES_EJEMPLO: Publicacion[] = [
  {
    id: 'pub_ejemplo_monserrate',
    titulo: '¿Alguien para subir a Monserrate el sábado?',
    cuerpo: 'Pienso salir a las 7 a. m. desde la estación del funicular. Somos dos y buscamos más compañía.',
    autor: 'Laura M.',
    fechaCreacion: 1736208000000,
    lat: 4.6058,
    lon: -74.0562,
  },
  {
    id: 'pub_ejemplo_museo_oro',
    titulo: 'Tip para el Museo del Oro',
    cuerpo: 'Vayan con calma: el recorrido completo toma unas dos horas. La sala de ofrendas es la mejor parte.',
    autor: 'Andrés P.',
    fechaCreacion: 1736294400000,
    lat: 4.6018,
    lon: -74.072,
  },
  {
    id: 'pub_ejemplo_usaquen',
    titulo: 'Busco grupo para el Mercado de Usaquén',
    cuerpo: 'Me interesa ir el domingo a ver artesanías y probar comida. ¿Alguien se apunta?',
    autor: 'Camila R.',
    fechaCreacion: 1736380800000,
    lat: 4.6978,
    lon: -74.0441,
  },
  {
    id: 'pub_ejemplo_botanico',
    titulo: 'Recomendación: Jardín Botánico entre semana',
    cuerpo: 'Entre semana hay menos gente y se disfrutan mejor los invernaderos. Lleven chaqueta.',
    autor: 'Sofía G.',
    fechaCreacion: 1736467200000,
    lat: 4.6715,
    lon: -74.0964,
  },
];