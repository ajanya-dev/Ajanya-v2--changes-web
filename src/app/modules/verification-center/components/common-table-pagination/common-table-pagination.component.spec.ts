import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTablePaginationComponent } from './common-table-pagination.component';

describe('CommonTablePaginationComponent', () => {
  let component: CommonTablePaginationComponent;
  let fixture: ComponentFixture<CommonTablePaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonTablePaginationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommonTablePaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
