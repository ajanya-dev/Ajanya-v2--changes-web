import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesforceImportCheckComponent } from './salesforce-import-check.component';

describe('SalesforceImportCheckComponent', () => {
  let component: SalesforceImportCheckComponent;
  let fixture: ComponentFixture<SalesforceImportCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesforceImportCheckComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesforceImportCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
