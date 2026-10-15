import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesforceHomeComponent } from './salesforce-home.component';

describe('SalesforceHomeComponent', () => {
  let component: SalesforceHomeComponent;
  let fixture: ComponentFixture<SalesforceHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesforceHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesforceHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
