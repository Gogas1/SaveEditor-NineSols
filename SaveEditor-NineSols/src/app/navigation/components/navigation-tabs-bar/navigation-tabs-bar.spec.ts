import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationTabsBar } from './navigation-tabs-bar';

describe('NavigationTabsBar', () => {
  let component: NavigationTabsBar;
  let fixture: ComponentFixture<NavigationTabsBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationTabsBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationTabsBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
