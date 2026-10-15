import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickbankPolicyComponent } from './quickbank-policy.component';

describe('QuickbankPolicyComponent', () => {
  let component: QuickbankPolicyComponent;
  let fixture: ComponentFixture<QuickbankPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickbankPolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuickbankPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
