import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckMailModalComponent } from './check-mail-modal.component';

describe('CheckMailModalComponent', () => {
  let component: CheckMailModalComponent;
  let fixture: ComponentFixture<CheckMailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckMailModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckMailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
