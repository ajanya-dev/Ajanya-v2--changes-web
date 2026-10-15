import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDropdownMultiSelectComponent } from './card-dropdown-multi-select.component';

describe('CardDropdownMultiSelectComponent', () => {
  let component: CardDropdownMultiSelectComponent;
  let fixture: ComponentFixture<CardDropdownMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDropdownMultiSelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardDropdownMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
