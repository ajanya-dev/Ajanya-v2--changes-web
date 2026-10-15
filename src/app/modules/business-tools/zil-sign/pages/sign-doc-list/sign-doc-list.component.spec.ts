import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignDocListComponent } from './sign-doc-list.component';

describe('SignDocListComponent', () => {
  let component: SignDocListComponent;
  let fixture: ComponentFixture<SignDocListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignDocListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignDocListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
