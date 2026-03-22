import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTab } from './profile-tab';

describe('ProfileTab', () => {
  let component: ProfileTab;
  let fixture: ComponentFixture<ProfileTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
