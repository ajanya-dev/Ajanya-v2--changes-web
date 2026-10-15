import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcwPolicyComponent } from './ocw-policy.component';

describe('OcwPolicyComponent', () => {
  let component: OcwPolicyComponent;
  let fixture: ComponentFixture<OcwPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcwPolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OcwPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
