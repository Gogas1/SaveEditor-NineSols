import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileFlagControl } from './profile-flag-control';

describe('ProfileFlagControl', () => {
  let component: ProfileFlagControl;
  let fixture: ComponentFixture<ProfileFlagControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileFlagControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileFlagControl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
