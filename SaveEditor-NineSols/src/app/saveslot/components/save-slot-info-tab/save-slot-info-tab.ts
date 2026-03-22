import { Component, computed, inject, Signal, signal } from '@angular/core';
import { SaveSlotService } from '../../services/save-slot-service';
import { ProfilesService } from '../../../profile/services/profiles-service';
import { Profile } from '../../../profile/models/profile';
import { saveAs } from 'file-saver';
import { KeyValuePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-save-slot-info-tab',
  imports: [KeyValuePipe],
  templateUrl: './save-slot-info-tab.html',
  styleUrl: './save-slot-info-tab.scss'
})
export class SaveSlotInfoTab {
  saveSlotService = inject(SaveSlotService);
  profilesService = inject(ProfilesService);

  flags = signal<Record<string, Record<string, any>>>({});

  activeProfile = toSignal(this.profilesService.getActiveProfile$());

  constructor() {
    this.profilesService.getActiveProfile$().subscribe(() => this.handleDataChange());
    this.saveSlotService.saveSlotData$.subscribe(() => this.handleDataChange());
  }

  handleDataChange() {
    if(!this.saveSlotService.saveSlotDataSnapshot || this.activeProfile != undefined) {
      return;
    }

    this.handleProfileValue(this.activeProfile);
  }

  handleProfileValue(profile: Profile) {
    const snapshot = this.saveSlotService.saveSlotDataSnapshot;
    if(!snapshot) {
      return;
    }

    const flags = Object.fromEntries(
      profile.flags
        .filter((flag) => flag.key in snapshot.flagDict)
        .map((flag) => [flag.key, snapshot.flagDict[flag.key]]));
        
    this.flags.set(flags);
  }

  async saveSaveFile() {
    var blob = await this.saveSlotService.createFileBlob();
    if(!blob) {
      return;
    }
    
    saveAs(blob, "updatedFileSlot");
  }
}
