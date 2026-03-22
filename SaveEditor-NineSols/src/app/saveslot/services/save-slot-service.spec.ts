import { TestBed } from '@angular/core/testing';

import { SaveSlotService } from './save-slot-service';

describe('SaveSlotService', () => {
  let service: SaveSlotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaveSlotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
