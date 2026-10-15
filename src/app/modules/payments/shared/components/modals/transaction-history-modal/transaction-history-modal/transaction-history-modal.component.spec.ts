import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionHistoryModalComponent } from './transaction-history-modal.component';

describe('TransactionHistoryModalComponent', () => {
  let component: TransactionHistoryModalComponent;
  let fixture: ComponentFixture<TransactionHistoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistoryModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransactionHistoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
