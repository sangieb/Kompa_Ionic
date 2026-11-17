import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import type { Post } from '../models/post.model';
import { PostService } from '../post.service';

import { FeedPage } from './feed.page';

/** Stub hermético: ni red ni almacenamiento, la página solo orquesta. */
const SERVICIO_PRUEBA = {
  getLocalPosts: async (): Promise<Post[]> => [
    { id: '1', title: 'Hola', body: 'Mundo', author: 'Ana', createdAt: 0, lat: null, lon: null },
  ],
  refresh: () => of<Post[]>([]),
};

describe('FeedPage', () => {
  let component: FeedPage;
  let fixture: ComponentFixture<FeedPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedPage],
      providers: [{ provide: PostService, useValue: SERVICIO_PRUEBA }],
    });

    fixture = TestBed.createComponent(FeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
