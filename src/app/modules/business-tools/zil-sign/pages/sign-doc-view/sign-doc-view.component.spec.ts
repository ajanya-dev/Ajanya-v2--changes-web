import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignDocViewComponent } from './sign-doc-view.component';

describe('SignDocViewComponent', () => {
  let component: SignDocViewComponent;
  let fixture: ComponentFixture<SignDocViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignDocViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignDocViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
