import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { Perfil } from '../../../core/perfil/perfil.model';
import { RegistroBorradorService } from '../registro-borrador.service';

import { PerfilPreviewPage } from './perfil-preview.page';

const PERFIL_PRUEBA: Perfil = {
  nombre: 'Ana Tester',
  correo: 'ana@kompa.co',
  fechaNacimiento: '31/05/2000',
  nacionalidad: 'Colombiana/o',
  genero: 'Mujer',
  conectar: ['Mujeres'],
  idiomas: ['Español'],
  intereses: ['Senderismo'],
  fotoUri: null,
};

describe('PerfilPreviewPage', () => {
  let component: PerfilPreviewPage;
  let fixture: ComponentFixture<PerfilPreviewPage>;

  beforeEach(() => {
    // Sin borrador la página navega a /registro: se siembran datos de registro.
    TestBed.inject(RegistroBorradorService).guardar({
      perfil: PERFIL_PRUEBA,
      credenciales: { sal: '0011', hash: 'aabb' },
    });

    fixture = TestBed.createComponent(PerfilPreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el perfil del borrador', () => {
    expect(component.perfil?.nombre).toBe('Ana Tester');
  });
});
