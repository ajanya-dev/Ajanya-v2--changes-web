import { TestBed } from '@angular/core/testing';
import { PersonaV4Service } from './persona-v4.service';

describe('PersonaV4ServiceService', () => {
  let service: PersonaV4Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonaV4Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
