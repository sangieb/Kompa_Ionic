import * as L from 'leaflet';

/** Configuración base del mapa (equivale a ConfigMapa.kt). */
export const CONFIG_MAPA = {
  latDefault: 4.711,
  lonDefault: -74.0721,
  zoom: 14,
};

/** Fuente principal de teselas: Esri World Street Map. */
const URL_TESELAS = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

export interface OpcionesMapa {
  /** Mostrar los controles de zoom (por defecto sí). */
  zoomControl?: boolean;
  /** Zoom inicial (por defecto CONFIG_MAPA.zoom). */
  zoom?: number;
}

/** Crea el mapa Leaflet centrado en la ubicación por defecto (Bogotá). */
export function crearMapa(contenedor: HTMLElement, opciones: OpcionesMapa = {}): L.Map {
  const mapa = L.map(contenedor, { zoomControl: opciones.zoomControl ?? true }).setView(
    [CONFIG_MAPA.latDefault, CONFIG_MAPA.lonDefault],
    opciones.zoom ?? CONFIG_MAPA.zoom,
  );
  crearCapaBase().addTo(mapa);
  return mapa;
}

export function crearCapaBase(): L.TileLayer {
  return L.tileLayer(URL_TESELAS, {
    minZoom: 1,
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri',
  });
}

/** Pin morado (local) o azul (API); los colores vienen de variables.scss. */
export function crearIconoMarcador(tipo: 'local' | 'api'): L.DivIcon {
  const color =
    tipo === 'local' ? variableCss('--kompa-marker-local', '#7b2cbf') : variableCss('--kompa-marker-api', '#2f80ed');
  return L.divIcon({
    className: 'kompa-marcador',
    html: `
      <svg viewBox="0 0 24 30" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 30 12 30s12-9.2 12-18.1C24 5.3 18.6 0 12 0z"/>
        <circle fill="#ffffff" cx="12" cy="12" r="4.5"/>
      </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40], // la punta del pin
    popupAnchor: [0, -36],
  });
}

/** Texto seguro para el globo del marcador. */
export function crearGlobo(texto: string): HTMLElement {
  const elemento = document.createElement('strong');
  elemento.textContent = texto;
  return elemento;
}

/** Lee una variable CSS de :root con un color de respaldo. */
function variableCss(nombre: string, respaldo: string): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || respaldo;
}
