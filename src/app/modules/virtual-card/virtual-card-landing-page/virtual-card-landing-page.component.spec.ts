import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualCardLandingPageComponent } from './virtual-card-landing-page.component';

describe('VirtualCardLandingPageComponent', () => {
  let component: VirtualCardLandingPageComponent;
  let fixture: ComponentFixture<VirtualCardLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualCardLandingPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VirtualCardLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
