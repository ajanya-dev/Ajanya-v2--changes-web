import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterWalletsComponent } from './verification-center-wallets.component';

describe('VerificationCenterWalletsComponent', () => {
  let component: VerificationCenterWalletsComponent;
  let fixture: ComponentFixture<VerificationCenterWalletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterWalletsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterWalletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
