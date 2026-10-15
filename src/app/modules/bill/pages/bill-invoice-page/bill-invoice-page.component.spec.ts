import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillInvoicePageComponent } from './bill-invoice-page.component';

describe('BillInvoicePageComponent', () => {
  let component: BillInvoicePageComponent;
  let fixture: ComponentFixture<BillInvoicePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillInvoicePageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillInvoicePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
