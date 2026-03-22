import { Component, computed, inject, signal } from '@angular/core';
import { ProfilesService } from '../../services/profiles-service';
import { Profile } from '../../models/profile';
import { toSignal } from '@angular/core/rxjs-interop';
import { Field, form } from '@angular/forms/signals';

@Component({
  selector: 'app-profile-tab',
  imports: [Field],
  templateUrl: './profile-tab.html',
  styleUrl: './profile-tab.scss'
})
export class ProfileTab {
  readonly NOT_SELECTED_ID = 'not-selected';
  
  profilesService = inject(ProfilesService);
  
  activeProfile = toSignal(this.profilesService.getActiveProfile$(), { initialValue: null });
  allProfiles = toSignal(this.profilesService.getAll$());
  
  selectedProfileModel = signal({
    profileAlias: this.activeProfile()?.alias ?? this.NOT_SELECTED_ID,
  })
  activeProfileForm = form(this.selectedProfileModel);
  
  newRemoteProfileModel = signal({
    alias: '',
    src: ''
  });
  newRemoteProfileForm = form(this.newRemoteProfileModel);

  onProfileSelection(target: EventTarget | null) {
    let targetProfile = this.selectedProfileModel().profileAlias;
    if(targetProfile == this.NOT_SELECTED_ID) {
      this.profilesService.setActiveProfile$(undefined)
      return;
    }

    this.profilesService.setActiveProfile$(targetProfile);
  }

  onAddNewRemoteProfile() {
    let profileModel = this.newRemoteProfileModel(); 
    this.profilesService.addRemoteProfile({
      alias: profileModel.alias,
      src: profileModel.src
    })
  }
}
