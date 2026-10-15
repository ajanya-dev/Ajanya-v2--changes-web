import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonaVerificationV4Component } from './persona-verification-v4.component';

describe('PersonaVerificationV4Component', () => {
  let component: PersonaVerificationV4Component;
  let fixture: ComponentFixture<PersonaVerificationV4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaVerificationV4Component]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonaVerificationV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
