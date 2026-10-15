import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdooImportComponent } from './odoo-import.component';

describe('OdooImportComponent', () => {
  let component: OdooImportComponent;
  let fixture: ComponentFixture<OdooImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdooImportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdooImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
