import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationFaqRequirementsModalComponent } from './integration-faq-requirements-modal.component';

describe('IntegrationFaqRequirementsModalComponent', () => {
  let component: IntegrationFaqRequirementsModalComponent;
  let fixture: ComponentFixture<IntegrationFaqRequirementsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationFaqRequirementsModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntegrationFaqRequirementsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
