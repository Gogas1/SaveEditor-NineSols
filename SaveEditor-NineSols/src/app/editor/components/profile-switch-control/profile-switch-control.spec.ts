import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSwitchControl } from './profile-switch-control';

describe('ProfileSwitchControl', () => {
  let component: ProfileSwitchControl;
  let fixture: ComponentFixture<ProfileSwitchControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSwitchControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileSwitchControl);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
