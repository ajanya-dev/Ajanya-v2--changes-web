import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailToBillModalComponent } from './email-to-bill-modal.component';

describe('EmailToBillModalComponent', () => {
  let component: EmailToBillModalComponent;
  let fixture: ComponentFixture<EmailToBillModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailToBillModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailToBillModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
