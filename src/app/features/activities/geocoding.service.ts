import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Nominatim OpenStreetMap result. */
export interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
}

export type ResultadoNominatim = NominatimResult;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/';

/** Nominatim Geocoding API service. */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);

  /** Coordinates -> place name (reverse). Returns empty string on failure. */
  async getLocationName(lat: number, lon: number): Promise<string> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat)
      .set('lon', lon)
      .set('accept-language', 'es')
      .set('zoom', 16);
    try {
      const result = await firstValueFrom(this.http.get<NominatimResult>(`${NOMINATIM_URL}reverse`, { params }));
      return result.display_name ?? '';
    } catch (error) {
      console.warn(`Reverse geocoding failed (${lat}, ${lon})`, error);
      return '';
    }
  }

  /** Address -> first search match. Returns null on failure. */
  async searchAddress(address: string, viewbox?: string, countries?: string): Promise<NominatimResult | null> {
    let params = new HttpParams()
      .set('q', address)
      .set('format', 'jsonv2')
      .set('accept-language', 'es')
      .set('limit', 1);
    if (viewbox) params = params.set('viewbox', viewbox).set('bounded', 1);
    if (countries) params = params.set('countrycodes', countries);

    try {
      const list = await firstValueFrom(this.http.get<NominatimResult[]>(`${NOMINATIM_URL}search`, { params }));
      return list[0] ?? null;
    } catch (error) {
      console.warn(`Address search failed: ${address}`, error);
      return null;
    }
  }

  async nombreUbicacion(lat: number, lon: number): Promise<string> {
    return this.getLocationName(lat, lon);
  }

  async buscarDireccion(direccion: string, viewbox?: string, paises?: string): Promise<NominatimResult | null> {
    return this.searchAddress(direccion, viewbox, paises);
  }
}
