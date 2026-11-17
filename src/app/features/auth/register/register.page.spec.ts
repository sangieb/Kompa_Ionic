import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { MensajeService } from '../../../core/mensaje/mensaje.service';
import { isoHaceAnios } from '../../../shared/utils/fechas';
import { RegistroBorradorService } from '../registro-borrador.service';

import { RegistroPage } from './registro.page';

/** Llena todo el formulario salvo los consentimientos y el género. */
function llenarDatosObligatorios(component: RegistroPage): void {
  component.formulario.patchValue({
    nombre: 'Ana Tester',
    correo: 'ana@kompa.co',
    password: 'secreta',
    fechaNacimiento: isoHaceAnios(20),
    nacionalidad: 'Colombiana/o',
    idioma: 'Español',
    conectar: ['Mujeres'],
    intereses: ['Senderismo'],
  });
}

describe('RegistroPage', () => {
  let component: RegistroPage;
  let fixture: ComponentFixture<RegistroPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MensajeService, useValue: { mostrar: vi.fn() } }],
    });
    fixture = TestBed.createComponent(RegistroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no permite crear la cuenta sin aceptar términos y datos', () => {
    llenarDatosObligatorios(component);

    expect(component.formulario.valid).toBe(false);

    component.formulario.controls.aceptaTerminos.setValue(true);
    expect(component.formulario.valid).toBe(false);

    component.formulario.controls.aceptaDatos.setValue(true);
    expect(component.formulario.valid).toBe(true);
  });

  it('permite registrarse sin informar el género', () => {
    llenarDatosObligatorios(component);
    component.formulario.controls.aceptaTerminos.setValue(true);
    component.formulario.controls.aceptaDatos.setValue(true);

    expect(component.formulario.controls.genero.value).toBe('');
    expect(component.formulario.valid).toBe(true);
  });

  it('no guarda el borrador si falta aceptar los consentimientos', async () => {
    llenarDatosObligatorios(component);
    const borrador = TestBed.inject(RegistroBorradorService);
    const guardar = vi.spyOn(borrador, 'guardar');

    await component.crearCuenta();

    expect(guardar).not.toHaveBeenCalled();
    expect(component.modalTerminosAbierto()).toBe(true);
  });
});
