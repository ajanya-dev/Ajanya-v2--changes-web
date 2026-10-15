import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdpRunV2Component } from './adp-run-v2.component';

describe('AdpRunV2Component', () => {
  let component: AdpRunV2Component;
  let fixture: ComponentFixture<AdpRunV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdpRunV2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdpRunV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
