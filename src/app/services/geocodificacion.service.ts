import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Equivale a NominatimResult */
export interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name?: string;
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/';

/** Equivale a NominatimApi.kt + ActividadRepository.nombreUbicacion() / buscarDireccion() */
@Injectable({ providedIn: 'root' })
export class GeocodificacionService {

  constructor(private http: HttpClient) {}

  /** Coordenadas → nombre del lugar (reverse). Si falla devuelve "" */
  async nombreUbicacion(lat: number, lon: number): Promise<string> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat)
      .set('lon', lon)
      .set('accept-language', 'es')
      .set('zoom', 16);
    try {
      const r = await firstValueFrom(
        this.http.get<ResultadoNominatim>(`${URL_NOMINATIM}reverse`, { params })
      );
      return r.display_name ?? '';
    } catch (e) {
      console.warn(`Reverse geocoding fallido (${lat}, ${lon})`, e);
      return '';
    }
  }

  /** Dirección escrita → primer resultado (search). Si falla devuelve null */
  async buscarDireccion(
    direccion: string,
    viewbox?: string,
    paises?: string
  ): Promise<ResultadoNominatim | null> {
    let params = new HttpParams()
      .set('q', direccion)
      .set('format', 'jsonv2')
      .set('accept-language', 'es')
      .set('limit', 1);
    if (viewbox) params = params.set('viewbox', viewbox).set('bounded', 1);
    if (paises) params = params.set('countrycodes', paises);

    try {
      const lista = await firstValueFrom(
        this.http.get<ResultadoNominatim[]>(`${URL_NOMINATIM}search`, { params })
      );
      return lista[0] ?? null;
    } catch (e) {
      console.warn(`Búsqueda de dirección fallida: ${direccion}`, e);
      return null;
    }
  }
}