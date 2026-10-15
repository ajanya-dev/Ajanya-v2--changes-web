import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterV4Component } from './verification-center-v4.component';

describe('VerificationCenterV4Component', () => {
  let component: VerificationCenterV4Component;
  let fixture: ComponentFixture<VerificationCenterV4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterV4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
