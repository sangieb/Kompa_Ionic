import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { NewActivityPage } from './new-activity.page';

describe('NewActivityPage', () => {
  let component: NewActivityPage;
  let fixture: ComponentFixture<NewActivityPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewActivityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
