import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import type { Publicacion } from '../models/publicacion.model';
import { PublicacionService } from '../publicacion.service';

import { FeedPage } from './feed.page';

/** Stub hermético: ni red ni almacenamiento, la página solo orquesta. */
const SERVICIO_PRUEBA = {
  publicacionesLocales: async (): Promise<Publicacion[]> => [
    { id: '1', titulo: 'Hola', cuerpo: 'Mundo', autor: 'Ana', fechaCreacion: 0, lat: null, lon: null },
  ],
  refrescar: () => of<Publicacion[]>([]),
};

describe('FeedPage', () => {
  let component: FeedPage;
  let fixture: ComponentFixture<FeedPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedPage],
      providers: [{ provide: PublicacionService, useValue: SERVICIO_PRUEBA }],
    });

    fixture = TestBed.createComponent(FeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
