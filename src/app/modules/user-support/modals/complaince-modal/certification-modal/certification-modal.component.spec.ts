import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificationModalComponent } from './certification-modal.component';

describe('CertificationModalComponent', () => {
  let component: CertificationModalComponent;
  let fixture: ComponentFixture<CertificationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificationModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertificationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
