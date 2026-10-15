/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CommonHelpButtonComponent } from './common-help-button.component';

describe('CommonHelpButtonComponent', () => {
  let component: CommonHelpButtonComponent;
  let fixture: ComponentFixture<CommonHelpButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CommonHelpButtonComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonHelpButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
