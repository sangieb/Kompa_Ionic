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

    expect(enlaces.map((enlace) => enlace.textContent?.trim())).toEqual(['Mapa', 'Actividades', 'Feed', 'Perfil']);
  });

  it('ofrece cerrar sesión arriba y no duplica el acceso al perfil', () => {
    const salir = fixture.nativeElement.querySelector('ion-button.boton-salir') as HTMLElement | null;
    const perfil = fixture.nativeElement.querySelector('ion-button.boton-perfil') as HTMLElement | null;

    expect(salir).not.toBeNull();
    // Ionic mueve los atributos aria-* del host al botón real dentro del shadow DOM.
    const botonInterno = salir?.shadowRoot?.querySelector('button');
    expect(botonInterno?.getAttribute('aria-label')).toBe('Cerrar sesión');
    expect(perfil).toBeNull();
  });
});
