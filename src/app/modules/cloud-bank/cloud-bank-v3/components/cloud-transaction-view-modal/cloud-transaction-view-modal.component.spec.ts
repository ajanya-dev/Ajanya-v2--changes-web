import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudTransactionViewModalComponent } from './cloud-transaction-view-modal.component';

describe('CloudTransactionViewModalComponent', () => {
  let component: CloudTransactionViewModalComponent;
  let fixture: ComponentFixture<CloudTransactionViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudTransactionViewModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CloudTransactionViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
