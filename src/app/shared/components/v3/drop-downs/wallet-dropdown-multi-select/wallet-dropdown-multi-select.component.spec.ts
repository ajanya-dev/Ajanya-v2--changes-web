import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletDropdownMultiSelectComponent } from './wallet-dropdown-multi-select.component';

describe('WalletDropdownMultiSelectComponent', () => {
  let component: WalletDropdownMultiSelectComponent;
  let fixture: ComponentFixture<WalletDropdownMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletDropdownMultiSelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletDropdownMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
