/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MyBusinessesListV35Component } from './my-businesses-list-v35.component';

describe('MyBusinessesListV35Component', () => {
  let component: MyBusinessesListV35Component;
  let fixture: ComponentFixture<MyBusinessesListV35Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MyBusinessesListV35Component]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyBusinessesListV35Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
