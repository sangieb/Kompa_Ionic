import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la barra inferior con los cuatro destinos', () => {
    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('app-barra-inferior a') as NodeListOf<HTMLAnchorElement>,
    );

    expect(enlaces.map((enlace) => enlace.textContent?.trim())).toEqual(['Mapa', 'Lista', 'Feed', 'Perfil']);
  });
});
