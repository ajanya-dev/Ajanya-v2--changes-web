/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IntroService } from './intro.service';

describe('Service: Intro', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IntroService]
    });
  });

  it('should ...', inject([IntroService], (service: IntroService) => {
    expect(service).toBeTruthy();
  }));
});
