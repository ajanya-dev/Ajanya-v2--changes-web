import { TestBed } from '@angular/core/testing';

import { DocumentMailService } from './document-mail.service';

describe('DocumentMailService', () => {
  let service: DocumentMailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentMailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
