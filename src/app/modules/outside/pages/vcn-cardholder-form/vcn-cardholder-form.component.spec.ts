import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VcnCardholderFormComponent } from './vcn-cardholder-form.component';

describe('VcnCardholderFormComponent', () => {
  let component: VcnCardholderFormComponent;
  let fixture: ComponentFixture<VcnCardholderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VcnCardholderFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VcnCardholderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
