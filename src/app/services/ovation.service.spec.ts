import { TestBed } from '@angular/core/testing';

import { OvationService } from './ovation.service';

describe('OvationService', () => {
  let service: OvationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OvationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
