import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RerunVerificationComponent } from './rerun-verification.component';

describe('RerunVerificationComponent', () => {
  let component: RerunVerificationComponent;
  let fixture: ComponentFixture<RerunVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RerunVerificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RerunVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
