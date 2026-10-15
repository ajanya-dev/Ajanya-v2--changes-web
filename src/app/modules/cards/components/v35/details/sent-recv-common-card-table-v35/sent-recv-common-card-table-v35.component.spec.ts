/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SentCardTransactionTableV35Component } from './sent-recv-common-card-table-v35.component';

describe('SentCardTransactionTableV35Component', () => {
  let component: SentCardTransactionTableV35Component;
  let fixture: ComponentFixture<SentCardTransactionTableV35Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SentCardTransactionTableV35Component]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SentCardTransactionTableV35Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
