import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMailViewComponent } from './document-mail-view.component';

describe('DocumentMailViewComponent', () => {
  let component: DocumentMailViewComponent;
  let fixture: ComponentFixture<DocumentMailViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentMailViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentMailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
