import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DtMultiDropdownPayeeComponent } from './dt-multi-dropdown-payee.component';

describe('DtMultiDropdownPayeeComponent', () => {
  let component: DtMultiDropdownPayeeComponent;
  let fixture: ComponentFixture<DtMultiDropdownPayeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DtMultiDropdownPayeeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DtMultiDropdownPayeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
