import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroTourLayoutComponent } from './intro-tour-layout.component';

describe('IntroTourLayoutComponent', () => {
  let component: IntroTourLayoutComponent;
  let fixture: ComponentFixture<IntroTourLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroTourLayoutComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IntroTourLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
