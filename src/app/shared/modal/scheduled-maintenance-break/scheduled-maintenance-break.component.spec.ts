import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledMaintenanceBreakComponent } from './scheduled-maintenance-break.component';

describe('ScheduledMaintenanceBreakComponent', () => {
  let component: ScheduledMaintenanceBreakComponent;
  let fixture: ComponentFixture<ScheduledMaintenanceBreakComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledMaintenanceBreakComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScheduledMaintenanceBreakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
