import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentMailComponent } from './document-mail.component';

describe('DocumentMailComponent', () => {
  let component: DocumentMailComponent;
  let fixture: ComponentFixture<DocumentMailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DocumentMailComponent]
    });
    fixture = TestBed.createComponent(DocumentMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
