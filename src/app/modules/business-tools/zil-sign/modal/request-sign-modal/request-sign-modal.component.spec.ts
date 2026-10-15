import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestSignModalComponent } from './request-sign-modal.component';

describe('RequestSignModalComponent', () => {
  let component: RequestSignModalComponent;
  let fixture: ComponentFixture<RequestSignModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestSignModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequestSignModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
