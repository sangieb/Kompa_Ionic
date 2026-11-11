import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap } from 'rxjs';
import { AlmacenamientoService } from './almacenamiento.service';
import { Publicacion } from '../models/publicacion.model';
import { PUBLICACIONES_EJEMPLO } from '../data/publicaciones-ejemplo';
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

export interface NuevaPublicacion {
  titulo: string;
  cuerpo: string;
  autor: string;
}

/** Equivale a data/publicacion/PublicacionRepository.kt, más la opción de publicar */
@Injectable({ providedIn: 'root' })
export class PublicacionService {
  private readonly CLAVE = 'publicaciones';

  constructor(
    private http: HttpClient,
    private almacenamiento: AlmacenamientoService
  ) {}

  async publicacionesLocales(): Promise<Publicacion[]> {
    return ordenar(await this.todas());
  }

  /** Crea una publicación local y la guarda */
  async publicar(datos: NuevaPublicacion): Promise<Publicacion> {
    const nueva: Publicacion = {
      id: crypto.randomUUID(),
      titulo: datos.titulo,
      cuerpo: datos.cuerpo,
      autor: datos.autor,
      fechaCreacion: Date.now(),
      lat: null,
      lon: null,
    };
    const lista = await this.todas();
    lista.push(nueva);
    await this.almacenamiento.guardar(this.CLAVE, lista);
    return nueva;
  }

  /**
   * Pide las publicaciones a la API. Es un Observable: la petición
   * solo se hace cuando alguien llama a .subscribe() (ver PDF Unidad 4).
   * Si la API falla, devuelve el caché local, igual que en Kotlin.
   */
  refrescar(): Observable<Publicacion[]> {
    return this.http.get<PublicacionDto[]>(`${API_BASE_URL}publicaciones`).pipe(
      map((dtos) => aPublicaciones(dtos)),
      switchMap((nuevas) => from(this.guardarDeApi(nuevas))),
      catchError((error) => {
        console.warn('Refresco de publicaciones fallido; se conserva el caché local', error);
        return from(this.publicacionesLocales());
      })
    );
  }

  /** Inserta o reemplaza por id (OnConflictStrategy.REPLACE) */
  private async guardarDeApi(nuevas: Publicacion[]): Promise<Publicacion[]> {
    const ids = new Set(nuevas.map((p) => p.id));
    const actuales = await this.todas();
    await this.almacenamiento.guardar(this.CLAVE, [
      ...actuales.filter((p) => !ids.has(p.id)),
      ...nuevas,
    ]);
    return this.publicacionesLocales();
  }

  /** La primera vez guarda las publicaciones de ejemplo */
  private async todas(): Promise<Publicacion[]> {
    if (!(await this.almacenamiento.existe(this.CLAVE))) {
      await this.almacenamiento.guardar(this.CLAVE, PUBLICACIONES_EJEMPLO);
      return [...PUBLICACIONES_EJEMPLO];
    }
    return this.almacenamiento.leer<Publicacion[]>(this.CLAVE, []);
  }
}

/** ORDER BY fecha_creacion DESC, titulo ASC */
function ordenar(lista: Publicacion[]): Publicacion[] {
  return [...lista].sort((a, b) => {
    const fa = a.fechaCreacion ?? -Infinity;
    const fb = b.fechaCreacion ?? -Infinity;
    if (fa !== fb) return fb - fa;
    return a.titulo.localeCompare(b.titulo);
  });
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