import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignPdfViewerComponent } from './sign-pdf-viewer.component';

describe('SignPdfViewerComponent', () => {
  let component: SignPdfViewerComponent;
  let fixture: ComponentFixture<SignPdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignPdfViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignPdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
