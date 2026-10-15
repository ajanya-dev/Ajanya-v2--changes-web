import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankDataLandingComponent } from './bank-data-landing.component';

describe('BankDataLandingComponent', () => {
  let component: BankDataLandingComponent;
  let fixture: ComponentFixture<BankDataLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankDataLandingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BankDataLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
