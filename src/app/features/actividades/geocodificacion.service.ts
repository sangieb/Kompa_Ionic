import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Resultado de Nominatim (OpenStreetMap). */
export interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name?: string;
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/';

/** Consultas a la API de geocodificación Nominatim. */
@Injectable({ providedIn: 'root' })
export class GeocodificacionService {
  private readonly http = inject(HttpClient);

  /** Coordenadas → nombre del lugar (reverse). Si falla devuelve "". */
  async nombreUbicacion(lat: number, lon: number): Promise<string> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat)
      .set('lon', lon)
      .set('accept-language', 'es')
      .set('zoom', 16);
    try {
      const resultado = await firstValueFrom(this.http.get<ResultadoNominatim>(`${URL_NOMINATIM}reverse`, { params }));
      return resultado.display_name ?? '';
    } catch (error) {
      console.warn(`Reverse geocoding fallido (${lat}, ${lon})`, error);
      return '';
    }
  }

  /** Dirección escrita → primer resultado (search). Si falla devuelve null. */
  async buscarDireccion(direccion: string, viewbox?: string, paises?: string): Promise<ResultadoNominatim | null> {
    let params = new HttpParams()
      .set('q', direccion)
      .set('format', 'jsonv2')
      .set('accept-language', 'es')
      .set('limit', 1);
    if (viewbox) params = params.set('viewbox', viewbox).set('bounded', 1);
    if (paises) params = params.set('countrycodes', paises);

    try {
      const lista = await firstValueFrom(this.http.get<ResultadoNominatim[]>(`${URL_NOMINATIM}search`, { params }));
      return lista[0] ?? null;
    } catch (error) {
      console.warn(`Búsqueda de dirección fallida: ${direccion}`, error);
      return null;
    }
  }
}
