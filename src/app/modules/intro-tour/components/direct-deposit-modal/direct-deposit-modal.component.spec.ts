import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectDepositModalComponent } from './direct-deposit-modal.component';

describe('DirectDepositModalComponent', () => {
  let component: DirectDepositModalComponent;
  let fixture: ComponentFixture<DirectDepositModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectDepositModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DirectDepositModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
