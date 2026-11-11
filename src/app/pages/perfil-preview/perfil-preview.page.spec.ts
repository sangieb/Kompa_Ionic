import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilPreviewPage } from './perfil-preview.page';

describe('PerfilPreviewPage', () => {
  let component: PerfilPreviewPage;
  let fixture: ComponentFixture<PerfilPreviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilPreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
