import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSendMailPageComponent } from './document-send-mail-page.component';

describe('DocumentSendMailPageComponent', () => {
  let component: DocumentSendMailPageComponent;
  let fixture: ComponentFixture<DocumentSendMailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSendMailPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentSendMailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
