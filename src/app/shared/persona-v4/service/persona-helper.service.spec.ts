import { TestBed } from '@angular/core/testing';
import { PersonaHelperService } from './persona-helper.service';

describe('PersonaHelperService', () => {
  let service: PersonaHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonaHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
