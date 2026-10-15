import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HubspotHomeComponent } from './hubspot-home.component';

describe('HubspotHomeComponent', () => {
  let component: HubspotHomeComponent;
  let fixture: ComponentFixture<HubspotHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HubspotHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HubspotHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});