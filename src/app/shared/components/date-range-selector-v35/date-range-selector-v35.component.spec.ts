/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DateRangeSelectorV35Component } from './date-range-selector-v35.component';

describe('DateRangeSelectorV35Component', () => {
  let component: DateRangeSelectorV35Component;
  let fixture: ComponentFixture<DateRangeSelectorV35Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DateRangeSelectorV35Component]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateRangeSelectorV35Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
