/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { VerifyCardModalComponent } from './verify-card-modal.component';

describe('VerifyCardModalComponent', () => {
  let component: VerifyCardModalComponent;
  let fixture: ComponentFixture<VerifyCardModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VerifyCardModalComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerifyCardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
