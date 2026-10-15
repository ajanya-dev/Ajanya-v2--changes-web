import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiCheckMail1Component } from './multi-check-mail1.component';

describe('MultiCheckMail1Component', () => {
  let component: MultiCheckMail1Component;
  let fixture: ComponentFixture<MultiCheckMail1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiCheckMail1Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiCheckMail1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
