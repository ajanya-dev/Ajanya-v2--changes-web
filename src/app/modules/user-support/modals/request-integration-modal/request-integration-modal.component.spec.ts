import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestIntegrationModalComponent } from './request-integration-modal.component';

describe('RequestIntegrationModalComponent', () => {
  let component: RequestIntegrationModalComponent;
  let fixture: ComponentFixture<RequestIntegrationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestIntegrationModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequestIntegrationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
