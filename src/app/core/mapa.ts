import * as L from 'leaflet';

/** Equivale a ConfigMapa.kt */
export const CONFIG_MAPA = {
  latDefault: 4.711,
  lonDefault: -74.0721,
  zoom: 14,
};

/** Equivale a FuenteDeMapa.PRINCIPAL (Esri World Street Map) */
const URL_TESELAS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

export function crearCapaBase(): L.TileLayer {
  return L.tileLayer(URL_TESELAS, {
    minZoom: 1,
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri',
  });
}

/** Pin morado (local) o azul (API), como ic_marker_local / ic_marker_api */
export function crearIconoMarcador(tipo: 'local' | 'api'): L.DivIcon {
  const color = tipo === 'local' ? '#7B2CBF' : '#2F80ED';
  return L.divIcon({
    className: 'kompa-marcador',
    html: `
      <svg viewBox="0 0 24 30" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 30 12 30s12-9.2 12-18.1C24 5.3 18.6 0 12 0z"/>
        <circle fill="#ffffff" cx="12" cy="12" r="4.5"/>
      </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],   // la punta del pin (ANCHOR_CENTER, ANCHOR_BOTTOM)
    popupAnchor: [0, -36],
  });
}

/** Texto seguro para el globo del marcador */
export function crearGlobo(texto: string): HTMLElement {
  const elemento = document.createElement('strong');
  elemento.textContent = texto;
  return elemento;
}