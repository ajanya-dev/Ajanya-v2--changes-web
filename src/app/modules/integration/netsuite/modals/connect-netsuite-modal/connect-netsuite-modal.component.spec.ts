import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectNetsuiteModalComponent } from './connect-netsuite-modal.component';

describe('ConnectNetsuiteModalComponent', () => {
  let component: ConnectNetsuiteModalComponent;
  let fixture: ComponentFixture<ConnectNetsuiteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectNetsuiteModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectNetsuiteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
