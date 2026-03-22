import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEditorTab } from './new-editor-tab';

describe('NewEditorTab', () => {
  let component: NewEditorTab;
  let fixture: ComponentFixture<NewEditorTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEditorTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEditorTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
