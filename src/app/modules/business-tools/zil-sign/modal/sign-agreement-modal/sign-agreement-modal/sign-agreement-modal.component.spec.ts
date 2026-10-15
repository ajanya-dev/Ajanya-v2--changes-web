import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignAgreementModalComponent } from './sign-agreement-modal.component';

describe('SignAgreementModalComponent', () => {
  let component: SignAgreementModalComponent;
  let fixture: ComponentFixture<SignAgreementModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignAgreementModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignAgreementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
