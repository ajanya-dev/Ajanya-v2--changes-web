import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseMultiImportComponent } from './enterprise-multi-import.component';

describe('EnterpriseMultiImportComponent', () => {
  let component: EnterpriseMultiImportComponent;
  let fixture: ComponentFixture<EnterpriseMultiImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseMultiImportComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseMultiImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
