import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap } from 'rxjs';
import { AlmacenamientoService } from './almacenamiento.service';
import { Publicacion } from '../models/publicacion.model';
import { API_BASE_URL } from '../core/config';

/** Lo que devolvería la API (todo opcional), como PublicacionDto */
interface PublicacionDto {
  id?: string | null;
  titulo?: string | null;
  cuerpo?: string | null;
  autor?: string | null;
  fechaCreacionLong?: number | null;
  lat?: number | null;
  lon?: number | null;
}

/** Equivale a data/publicacion/PublicacionRepository.kt */
@Injectable({ providedIn: 'root' })
export class PublicacionService {
  private readonly CLAVE = 'publicaciones';

  constructor(
    private http: HttpClient,
    private almacenamiento: AlmacenamientoService
  ) {}

  async publicacionesLocales(): Promise<Publicacion[]> {
    const lista = await this.almacenamiento.leer<Publicacion[]>(this.CLAVE, []);
    // ORDER BY fecha_creacion DESC, titulo ASC
    return [...lista].sort((a, b) => {
      const fa = a.fechaCreacion ?? -Infinity;
      const fb = b.fechaCreacion ?? -Infinity;
      if (fa !== fb) return fb - fa;
      return a.titulo.localeCompare(b.titulo);
    });
  }

  /**
   * Pide las publicaciones a la API. Es un Observable: la petición
   * solo se hace cuando alguien llama a .subscribe() (ver PDF Unidad 4).
   * Si la API falla, devuelve el caché local, igual que en Kotlin.
   */
  refrescar(): Observable<Publicacion[]> {
    return this.http.get<PublicacionDto[]>(`${API_BASE_URL}publicaciones`).pipe(
      map((dtos) => aPublicaciones(dtos)),
      switchMap((nuevas) => from(this.guardar(nuevas))),
      catchError((error) => {
        console.warn('Refresco de publicaciones fallido; se conserva el caché local', error);
        return from(this.publicacionesLocales());
      })
    );
  }

  /** Inserta o reemplaza por id (OnConflictStrategy.REPLACE) y devuelve la lista */
  private async guardar(nuevas: Publicacion[]): Promise<Publicacion[]> {
    const ids = new Set(nuevas.map((p) => p.id));
    const actuales = await this.almacenamiento.leer<Publicacion[]>(this.CLAVE, []);
    await this.almacenamiento.guardar(this.CLAVE, [
      ...actuales.filter((p) => !ids.has(p.id)),
      ...nuevas,
    ]);
    return this.publicacionesLocales();
  }
}

/** Equivale a aPublicaciones(): descarta las que no tienen id y repetidas */
function aPublicaciones(dtos: PublicacionDto[]): Publicacion[] {
  const vistos = new Set<string>();
  const resultado: Publicacion[] = [];
  for (const dto of dtos ?? []) {
    if (!dto.id || vistos.has(dto.id)) continue;
    vistos.add(dto.id);
    resultado.push({
      id: dto.id,
      titulo: dto.titulo ?? '',
      cuerpo: dto.cuerpo ?? '',
      autor: dto.autor ?? '',
      fechaCreacion: dto.fechaCreacionLong ?? null,
      lat: dto.lat ?? null,
      lon: dto.lon ?? null,
    });
  }
  return resultado;
}