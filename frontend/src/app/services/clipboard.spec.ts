import { TestBed } from '@angular/core/testing';

import { Clipboard } from './clipboard';

describe('Clipboard', () => {
  let service: Clipboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Clipboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
