import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsMailDataTableComponent } from './documents-mail-data-table.component';

describe('DocumentsMailDataTableComponent', () => {
  let component: DocumentsMailDataTableComponent;
  let fixture: ComponentFixture<DocumentsMailDataTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentsMailDataTableComponent]
    });
    fixture = TestBed.createComponent(DocumentsMailDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
