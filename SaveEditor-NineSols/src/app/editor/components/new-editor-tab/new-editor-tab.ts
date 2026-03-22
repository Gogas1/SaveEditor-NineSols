import { Component, computed, inject, Injector, runInInjectionContext, signal } from '@angular/core';
import { SaveSlotService } from '../../../saveslot/services/save-slot-service';
import { ProfilesService } from '../../../profile/services/profiles-service';
import { form } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { Profile } from '../../../profile/models/profile';

type SwitchModel = { selected: string }
type FlagModel = { type: string; value: any };
type WorkingModel = { flags: Record<string, Record<string, FlagModel>>, switches: Record<string, SwitchModel> }

@Component({
  selector: 'app-new-editor-tab',
  imports: [],
  templateUrl: './new-editor-tab.html',
  styleUrl: './new-editor-tab.scss',
})
export class NewEditorTab {
  saveSlotService = inject(SaveSlotService);
  profilesService = inject(ProfilesService);

  workingModel = signal<WorkingModel>({ flags: {}, switches: {} });
  workingForm = form(this.workingModel);

  activeProfile = toSignal(this.profilesService.getActiveProfile$());
  saveSlotData = toSignal(this.saveSlotService.saveSlotData$);

  isLoaded = computed(() => this.activeProfile() && this.saveSlotData());

  constructor(private injector: Injector) {
    this.profilesService.getActiveProfile$().subscribe(() => this.handleDataChange());
    this.saveSlotService.saveSlotData$.subscribe(() => this.handleDataChange());

    this.handleDataChange();
  }

  getIsFlagEntrySavedStatus(key: string, entry: string) {
    return this.saveSlotData()?.flagDict[key][entry] == this.workingModel().flags[key][entry];
  }

  handleDataChange() {
    if (!this.isLoaded()) {
      return;
    }

    let activeProfile = this.activeProfile();

    this.handleProfileValue(activeProfile!.data!);
  }
  handleProfileValue(profile: Profile) {
    const snapshot = this.saveSlotService.saveSlotDataSnapshot;
    if (!snapshot) {
      return;
    }

    const flags = Object.fromEntries(
      profile.flags
        .map((f) => [f.key, snapshot.flagDict[f.key]]));

    const switches = Object.fromEntries(
      profile.switches
        .map((s) => [s.name, {} as SwitchModel])
    )

    this.workingModel.set(this.createFlagsModel(flags, switches));

    runInInjectionContext(this.injector, () => {
      this.workingForm = form(this.workingModel);
    });
  }
  private createFlagsModel(flags: Record<string, Record<string, any>>, switches: Record<string, SwitchModel>) {
    const flagsEntry: Record<string, Record<string, FlagModel>> = {};
    const switchesEntry: Record<string, SwitchModel> = {};
    const result: WorkingModel = { flags: flagsEntry, switches: switchesEntry };
        
    Object.keys(flags).forEach(key => {
      flagsEntry[key] = Object.fromEntries(Object.entries(flags[key]).map(([entryKey, value]) => 
        [entryKey, { type: this.detectType(value), value }]))
    });

    Object.keys(switches).forEach(switchName => {
      switchesEntry[switchName] = { selected: '' }
    });

    return result;
  }
  private detectType(value: any): 'text' | 'number' | 'checkbox' {
    if (typeof value === 'string') return 'text';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'checkbox';
    return 'text';
  }
}
