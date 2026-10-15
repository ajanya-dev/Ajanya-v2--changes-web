import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMailFilesTableComponent } from './document-mail-files-table.component';

describe('DocumentMailFilesTableComponent', () => {
  let component: DocumentMailFilesTableComponent;
  let fixture: ComponentFixture<DocumentMailFilesTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentMailFilesTableComponent]
    });
    fixture = TestBed.createComponent(DocumentMailFilesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
