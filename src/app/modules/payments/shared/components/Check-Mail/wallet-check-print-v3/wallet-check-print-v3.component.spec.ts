/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WalletCheckPrintV3Component } from './wallet-check-print-v3.component';

describe('WalletCheckPrintV3Component', () => {
  let component: WalletCheckPrintV3Component;
  let fixture: ComponentFixture<WalletCheckPrintV3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WalletCheckPrintV3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletCheckPrintV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
