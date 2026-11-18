import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { Profile } from '../../../core/profile/profile.model';
import { RegistrationDraftService } from '../registration-draft.service';

import { ProfilePreviewPage } from './profile-preview.page';

const PERFIL_PRUEBA: Profile = {
  name: 'Ana Tester',
  email: 'ana@kompa.co',
  birthDate: '31/05/2000',
  nationality: 'Colombiana/o',
  gender: 'Mujer',
  connectWith: ['Mujeres'],
  languages: ['Español'],
  interests: ['Senderismo'],
  photoUri: null,
};

describe('ProfilePreviewPage', () => {
  let component: ProfilePreviewPage;
  let fixture: ComponentFixture<ProfilePreviewPage>;

  beforeEach(() => {
    // Sin borrador la página navega a /registro: se siembran datos de registro.
    TestBed.inject(RegistrationDraftService).guardar({
      profile: PERFIL_PRUEBA,
      credentials: { salt: '0011', hash: 'aabb' },
      consent: { terms: true, data: true, date: '2026-11-16T10:00:00.000Z' },
    });

    fixture = TestBed.createComponent(ProfilePreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el perfil del borrador', () => {
    expect(component.perfil?.name).toBe('Ana Tester');
  });
});
