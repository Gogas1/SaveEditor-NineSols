import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTab } from './editor-tab';

describe('EditorTab', () => {
  let component: EditorTab;
  let fixture: ComponentFixture<EditorTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
