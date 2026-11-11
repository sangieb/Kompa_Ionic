import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, switchMap, from } from 'rxjs';

import { AlmacenamientoService } from '../../core/storage/almacenamiento.service';
import { ClavesAlmacenamiento } from '../../core/storage/claves';
import { PUBLICACIONES_EJEMPLO } from '../../data/publicaciones-ejemplo';
import { environment } from '../../../environments/environment';
import { ordenarPorFechaYNombre } from '../../shared/utils/ordenar';

import type { Publicacion } from './models/publicacion.model';

/** Post de JSONPlaceholder (https://jsonplaceholder.typicode.com). */
interface PostDto {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface NuevaPublicacion {
  titulo: string;
  cuerpo: string;
  autor: string;
}

const LIMITE_POSTS_API = 20;

/**
 * Publicaciones del feed: locales del usuario + las que trae la API.
 * Offline-first: todo lo que ya se guardó queda disponible sin conexión.
 */
@Injectable({ providedIn: 'root' })
export class PublicacionService {
  private readonly http = inject(HttpClient);
  private readonly almacenamiento = inject(AlmacenamientoService);

  async publicacionesLocales(): Promise<Publicacion[]> {
    return ordenar(await this.todas());
  }

  /** Crea una publicación local y la guarda. */
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
    await this.almacenamiento.guardar(ClavesAlmacenamiento.publicaciones, lista);
    return nueva;
  }

  /**
   * Trae las publicaciones de la API y las combina con las locales.
   * Es un Observable: la petición solo se hace al suscribirse.
   */
  refrescar(): Observable<Publicacion[]> {
    return this.http.get<PostDto[]>(`${environment.apis.feed}/posts`, { params: { _limit: LIMITE_POSTS_API } }).pipe(
      map((posts) => posts.map(aPublicacion)),
      switchMap((deApi) => from(this.guardarDeApi(deApi))),
    );
  }

  /** Inserta o reemplaza por id (como OnConflictStrategy.REPLACE). */
  private async guardarDeApi(nuevas: Publicacion[]): Promise<Publicacion[]> {
    const ids = new Set(nuevas.map((p) => p.id));
    const actuales = await this.todas();
    await this.almacenamiento.guardar(ClavesAlmacenamiento.publicaciones, [
      ...actuales.filter((p) => !ids.has(p.id)),
      ...nuevas,
    ]);
    return this.publicacionesLocales();
  }

  /** La primera vez siembra las publicaciones de ejemplo. */
  private async todas(): Promise<Publicacion[]> {
    return [...(await this.almacenamiento.leerOSembrar(ClavesAlmacenamiento.publicaciones, PUBLICACIONES_EJEMPLO))];
  }
}

/** Convierte un post de la API en una publicación del feed. */
function aPublicacion(post: PostDto): Publicacion {
  return {
    id: `api-${post.id}`,
    titulo: post.title,
    cuerpo: post.body,
    autor: `Viajero ${post.userId}`,
    fechaCreacion: null,
    lat: null,
    lon: null,
  };
}

/** ORDER BY fecha_creacion DESC, titulo ASC */
function ordenar(lista: Publicacion[]): Publicacion[] {
  return ordenarPorFechaYNombre(
    lista,
    (p) => p.fechaCreacion,
    (p) => p.titulo,
  );
}
