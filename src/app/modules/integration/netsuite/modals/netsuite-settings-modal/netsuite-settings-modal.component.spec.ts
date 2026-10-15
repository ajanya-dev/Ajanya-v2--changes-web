import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetsuiteSettingsModalComponent } from './netsuite-settings-modal.component';

describe('NetsuiteSettingsModalComponent', () => {
  let component: NetsuiteSettingsModalComponent;
  let fixture: ComponentFixture<NetsuiteSettingsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetsuiteSettingsModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NetsuiteSettingsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
