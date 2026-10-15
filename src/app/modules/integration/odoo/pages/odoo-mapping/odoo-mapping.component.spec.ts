import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdooMappingComponent } from './odoo-mapping.component';

describe('OdooMappingComponent', () => {
  let component: OdooMappingComponent;
  let fixture: ComponentFixture<OdooMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdooMappingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdooMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
