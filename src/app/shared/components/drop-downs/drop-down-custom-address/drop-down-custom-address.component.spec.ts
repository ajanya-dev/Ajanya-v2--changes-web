import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropDownCustomAddressComponent } from './drop-down-custom-address.component';

describe('DropDownCustomAddressComponent', () => {
  let component: DropDownCustomAddressComponent;
  let fixture: ComponentFixture<DropDownCustomAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropDownCustomAddressComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DropDownCustomAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
