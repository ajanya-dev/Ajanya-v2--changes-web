import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectOdooModalComponent } from './connect-odoo-modal.component';

describe('ConnectOdooModalComponent', () => {
  let component: ConnectOdooModalComponent;
  let fixture: ComponentFixture<ConnectOdooModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectOdooModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectOdooModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
