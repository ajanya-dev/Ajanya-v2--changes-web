import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAddressModalComponent } from './add-address-modal.component';

describe('AddAddressModalComponent', () => {
  let component: AddAddressModalComponent;
  let fixture: ComponentFixture<AddAddressModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddAddressModalComponent]
    });
    fixture = TestBed.createComponent(AddAddressModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
