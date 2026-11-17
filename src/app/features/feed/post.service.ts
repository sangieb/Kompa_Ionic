import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, switchMap, from } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageKeys } from '../../core/storage/storage-keys';
import { StorageService } from '../../core/storage/storage.service';
import { SAMPLE_POSTS } from '../../data/sample-posts';
import { sortByDateAndName } from '../../shared/utils/sort';

import type { Post } from './models/post.model';

interface PostDto {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export interface NewPost {
  title: string;
  body: string;
  author: string;
  titulo?: string;
  cuerpo?: string;
  autor?: string;
}

export type NuevaPublicacion = NewPost;

const API_POSTS_LIMIT = 20;

/**
 * Feed post management service (offline-first).
 */
@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  async getLocalPosts(): Promise<Post[]> {
    return sortPosts(await this.getAll());
  }

  async publish(data: NewPost): Promise<Post> {
    const title = data.title ?? data.titulo ?? '';
    const body = data.body ?? data.cuerpo ?? '';
    const author = data.author ?? data.autor ?? '';
    const newPost: Post = {
      id: crypto.randomUUID(),
      title,
      body,
      author,
      createdAt: Date.now(),
      lat: null,
      lon: null,
      titulo: title,
      cuerpo: body,
      autor: author,
      fechaCreacion: Date.now(),
    };
    const list = await this.getAll();
    list.push(newPost);
    await this.storage.set(StorageKeys.posts, list);
    return newPost;
  }

  refresh(): Observable<Post[]> {
    return this.http.get<PostDto[]>(`${environment.apis.feed}/posts`, { params: { _limit: API_POSTS_LIMIT } }).pipe(
      map((posts) => posts.map(toPost)),
      switchMap((fromApi) => from(this.saveFromApi(fromApi))),
    );
  }

  private async saveFromApi(newPosts: Post[]): Promise<Post[]> {
    const ids = new Set(newPosts.map((p) => p.id));
    const current = await this.getAll();
    await this.storage.set(StorageKeys.posts, [...current.filter((p) => !ids.has(p.id)), ...newPosts]);
    return this.getLocalPosts();
  }

  async getAll(): Promise<Post[]> {
    return [...(await this.storage.getOrSeed(StorageKeys.posts, SAMPLE_POSTS))];
  }

  async publicacionesLocales(): Promise<Post[]> {
    return this.getLocalPosts();
  }

  async publicar(datos: NewPost): Promise<Post> {
    return this.publish(datos);
  }

  refrescar(): Observable<Post[]> {
    return this.refresh();
  }

  async todas(): Promise<Post[]> {
    return this.getAll();
  }
}

function toPost(post: PostDto): Post {
  return {
    id: `api-${post.id}`,
    title: post.title,
    body: post.body,
    author: `Viajero ${post.userId}`,
    createdAt: null,
    lat: null,
    lon: null,
    titulo: post.title,
    cuerpo: post.body,
    autor: `Viajero ${post.userId}`,
    fechaCreacion: null,
  };
}

function sortPosts(list: Post[]): Post[] {
  return sortByDateAndName(
    list,
    (p) => p.createdAt ?? p.fechaCreacion ?? null,
    (p) => p.title ?? p.titulo ?? '',
  );
}
