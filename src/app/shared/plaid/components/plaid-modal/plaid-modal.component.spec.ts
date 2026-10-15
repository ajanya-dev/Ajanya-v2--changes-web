import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaidModalComponent } from './plaid-modal.component';

describe('PlaidModalComponent', () => {
  let component: PlaidModalComponent;
  let fixture: ComponentFixture<PlaidModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaidModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlaidModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
