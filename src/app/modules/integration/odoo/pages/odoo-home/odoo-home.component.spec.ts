import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdooHomeComponent } from './odoo-home.component';

describe('OdooHomeComponent', () => {
  let component: OdooHomeComponent;
  let fixture: ComponentFixture<OdooHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdooHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OdooHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
