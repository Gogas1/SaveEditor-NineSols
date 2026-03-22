import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveFileTab } from './save-file-tab';

describe('SaveFileTab', () => {
  let component: SaveFileTab;
  let fixture: ComponentFixture<SaveFileTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveFileTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveFileTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
