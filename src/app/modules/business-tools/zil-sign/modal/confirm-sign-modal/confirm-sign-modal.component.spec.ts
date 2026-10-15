import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSignModalComponent } from './confirm-sign-modal.component';

describe('ConfirmSignModalComponent', () => {
  let component: ConfirmSignModalComponent;
  let fixture: ComponentFixture<ConfirmSignModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmSignModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmSignModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
