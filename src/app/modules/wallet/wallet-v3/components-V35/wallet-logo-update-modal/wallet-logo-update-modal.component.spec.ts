import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletLogoUpdateModalComponent } from './wallet-logo-update-modal.component';

describe('WalletLogoUpdateModalComponent', () => {
  let component: WalletLogoUpdateModalComponent;
  let fixture: ComponentFixture<WalletLogoUpdateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletLogoUpdateModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WalletLogoUpdateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
