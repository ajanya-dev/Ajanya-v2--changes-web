/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MailTrackComponent } from './mail-track.component';

describe('MailTrackComponent', () => {
  let component: MailTrackComponent;
  let fixture: ComponentFixture<MailTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MailTrackComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MailTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
