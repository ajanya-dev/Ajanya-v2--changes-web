import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterCardsComponent } from './verification-center-cards.component';

describe('VerificationCenterCardsComponent', () => {
  let component: VerificationCenterCardsComponent;
  let fixture: ComponentFixture<VerificationCenterCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterCardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
