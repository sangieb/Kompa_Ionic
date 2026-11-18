import * as L from 'leaflet';

/** Default map configuration. */
export const MAP_CONFIG = {
  defaultLat: 4.711,
  defaultLon: -74.0721,
  latDefault: 4.711,
  lonDefault: -74.0721,
  zoom: 14,
};

export const CONFIG_MAPA = MAP_CONFIG;

/** Primary tile source: Esri World Street Map. */
export const TILES_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

export interface MapOptions {
  /** Show zoom controls (defaults to true). */
  zoomControl?: boolean;
  /** Initial zoom level (defaults to MAP_CONFIG.zoom). */
  zoom?: number;
}

export type OpcionesMapa = MapOptions;

/** Creates a Leaflet map centered at default coordinates (Bogotá). */
export function createMap(container: HTMLElement, options: MapOptions = {}): L.Map {
  const map = L.map(container, { zoomControl: options.zoomControl ?? true }).setView(
    [MAP_CONFIG.defaultLat, MAP_CONFIG.defaultLon],
    options.zoom ?? MAP_CONFIG.zoom,
  );
  createBaseLayer().addTo(map);
  return map;
}

export const crearMapa = createMap;

export function createBaseLayer(): L.TileLayer {
  return L.tileLayer(TILES_URL, {
    minZoom: 1,
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri',
  });
}

export const crearCapaBase = createBaseLayer;

/** Purple pin (local) or blue pin (API); colors defined in variables.scss. */
export function createMarkerIcon(type: 'local' | 'api'): L.DivIcon {
  const color =
    type === 'local' ? cssVariable('--kompa-marker-local', '#7b2cbf') : cssVariable('--kompa-marker-api', '#2f80ed');
  return L.divIcon({
    className: 'kompa-marcador',
    html: `
      <svg viewBox="0 0 24 30" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
        <path fill="${color}" d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 30 12 30s12-9.2 12-18.1C24 5.3 18.6 0 12 0z"/>
        <circle fill="#ffffff" cx="12" cy="12" r="4.5"/>
      </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

export const crearIconoMarcador = createMarkerIcon;

/** Creates a bold element for popup text. */
export function createPopup(text: string): HTMLElement {
  const element = document.createElement('strong');
  element.textContent = text;
  return element;
}

export const crearGlobo = createPopup;

function cssVariable(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}
