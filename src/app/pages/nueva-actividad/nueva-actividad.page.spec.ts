import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaActividadPage } from './nueva-actividad.page';

describe('NuevaActividadPage', () => {
  let component: NuevaActividadPage;
  let fixture: ComponentFixture<NuevaActividadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NuevaActividadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
