import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchRequestViewComponent } from './ach-request-view.component';

describe('AchRequestViewComponent', () => {
  let component: AchRequestViewComponent;
  let fixture: ComponentFixture<AchRequestViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchRequestViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AchRequestViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
