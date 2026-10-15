import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceAlertModalComponent } from './maintenance-alert-modal.component';

describe('MaintenanceAlertModalComponent', () => {
  let component: MaintenanceAlertModalComponent;
  let fixture: ComponentFixture<MaintenanceAlertModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceAlertModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaintenanceAlertModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
