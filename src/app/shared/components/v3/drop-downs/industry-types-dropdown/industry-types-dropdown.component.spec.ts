import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndustryTypesDropdownComponent } from './industry-types-dropdown.component';

describe('IndustryTypesDropdownComponent', () => {
  let component: IndustryTypesDropdownComponent;
  let fixture: ComponentFixture<IndustryTypesDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndustryTypesDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndustryTypesDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
