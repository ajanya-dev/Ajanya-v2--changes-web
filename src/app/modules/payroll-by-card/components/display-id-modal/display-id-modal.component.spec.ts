import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayIdModalComponent } from './display-id-modal.component';

describe('DisplayIdModalComponent', () => {
  let component: DisplayIdModalComponent;
  let fixture: ComponentFixture<DisplayIdModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayIdModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayIdModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
