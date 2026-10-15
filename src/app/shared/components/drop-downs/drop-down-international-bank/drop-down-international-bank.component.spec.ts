import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDownInternationalBankComponent } from './drop-down-international-bank.component';

describe('DropDownInternationalBankComponent', () => {
  let component: DropDownInternationalBankComponent;
  let fixture: ComponentFixture<DropDownInternationalBankComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DropDownInternationalBankComponent]
    });
    fixture = TestBed.createComponent(DropDownInternationalBankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
