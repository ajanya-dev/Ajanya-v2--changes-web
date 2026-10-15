import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroCommonDatatableComponent } from './intro-common-datatable.component';

describe('IntroCommonDatatableComponent', () => {
  let component: IntroCommonDatatableComponent;
  let fixture: ComponentFixture<IntroCommonDatatableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroCommonDatatableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IntroCommonDatatableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
