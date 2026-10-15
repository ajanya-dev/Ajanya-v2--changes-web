import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchRequestDataTableComponent } from './ach-request-data-table.component';

describe('AchRequestDataTableComponent', () => {
  let component: AchRequestDataTableComponent;
  let fixture: ComponentFixture<AchRequestDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchRequestDataTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AchRequestDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
