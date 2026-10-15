import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterBusinessesComponent } from './verification-center-businesses.component';

describe('VerificationCenterBusinessesComponent', () => {
  let component: VerificationCenterBusinessesComponent;
  let fixture: ComponentFixture<VerificationCenterBusinessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterBusinessesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterBusinessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
