import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessListModalComponent } from './business-list-modal.component';

describe('BusinessListModalComponent', () => {
  let component: BusinessListModalComponent;
  let fixture: ComponentFixture<BusinessListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessListModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusinessListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
