/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OurCompliancesComponent } from './our-compliances.component';

describe('OurCompliancesComponent', () => {
  let component: OurCompliancesComponent;
  let fixture: ComponentFixture<OurCompliancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OurCompliancesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OurCompliancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
