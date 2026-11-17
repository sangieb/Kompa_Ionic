import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { MessageService } from '../../../core/message/message.service';
import { isoHaceAnios } from '../../../shared/utils/dates';
import { RegistrationDraftService } from '../registration-draft.service';

import { RegisterPage } from './register.page';

/** Llena todo el formulario salvo los consentimientos y el género. */
function llenarDatosObligatorios(component: RegisterPage): void {
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

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MessageService, useValue: { show: vi.fn() } }],
    });
    fixture = TestBed.createComponent(RegisterPage);
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
    const borrador = TestBed.inject(RegistrationDraftService);
    const guardar = vi.spyOn(borrador, 'guardar');

    await component.crearCuenta();

    expect(guardar).not.toHaveBeenCalled();
    expect(component.modalTerminosAbierto()).toBe(true);
  });
});
