import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMailModalComponent } from './document-mail-modal.component';

describe('DocumentMailModalComponent', () => {
  let component: DocumentMailModalComponent;
  let fixture: ComponentFixture<DocumentMailModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentMailModalComponent]
    });
    fixture = TestBed.createComponent(DocumentMailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
