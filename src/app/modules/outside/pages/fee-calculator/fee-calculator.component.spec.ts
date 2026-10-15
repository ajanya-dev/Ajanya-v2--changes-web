import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeCalculatorComponent } from './fee-calculator.component';

describe('FeeCalculatorComponent', () => {
  let component: FeeCalculatorComponent;
  let fixture: ComponentFixture<FeeCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeCalculatorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FeeCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
