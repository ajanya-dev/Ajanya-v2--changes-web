import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobberHomeComponent } from './jobber-home.component';

describe('JobberHomeComponent', () => {
  let component: JobberHomeComponent;
  let fixture: ComponentFixture<JobberHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobberHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobberHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});