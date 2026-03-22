import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveSlotInfoTab } from './save-slot-info-tab';

describe('SaveSlotInfoTab', () => {
  let component: SaveSlotInfoTab;
  let fixture: ComponentFixture<SaveSlotInfoTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveSlotInfoTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveSlotInfoTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
