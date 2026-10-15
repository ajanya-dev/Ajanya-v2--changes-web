import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailPhoneVerificationModalV4Component } from './email-phone-verification-modal-v4.component';

describe('EmailPhoneVerificationModalV4Component', () => {
  let component: EmailPhoneVerificationModalV4Component;
  let fixture: ComponentFixture<EmailPhoneVerificationModalV4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailPhoneVerificationModalV4Component]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailPhoneVerificationModalV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
