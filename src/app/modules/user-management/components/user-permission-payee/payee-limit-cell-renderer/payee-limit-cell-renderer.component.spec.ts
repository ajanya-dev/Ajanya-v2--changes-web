import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayeeLimitCellRendererComponent } from './payee-limit-cell-renderer.component';

describe('PayeeLimitCellRendererComponent', () => {
  let component: PayeeLimitCellRendererComponent;
  let fixture: ComponentFixture<PayeeLimitCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayeeLimitCellRendererComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PayeeLimitCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
