import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMailStatementModalComponent } from './document-mail-statement-modal.component';

describe('DocumentMailStatementModalComponent', () => {
  let component: DocumentMailStatementModalComponent;
  let fixture: ComponentFixture<DocumentMailStatementModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentMailStatementModalComponent]
    });
    fixture = TestBed.createComponent(DocumentMailStatementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
