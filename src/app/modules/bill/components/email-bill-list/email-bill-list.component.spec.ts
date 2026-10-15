import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailBillListComponent } from './email-bill-list.component';

describe('EmailBillListComponent', () => {
  let component: EmailBillListComponent;
  let fixture: ComponentFixture<EmailBillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailBillListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailBillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
