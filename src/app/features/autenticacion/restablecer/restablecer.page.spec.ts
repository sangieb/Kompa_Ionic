import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RestablecerPage } from './restablecer.page';

describe('RestablecerPage', () => {
  let component: RestablecerPage;
  let fixture: ComponentFixture<RestablecerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RestablecerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
