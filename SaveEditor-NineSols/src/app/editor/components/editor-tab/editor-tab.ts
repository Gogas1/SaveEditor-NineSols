import { Component, computed, inject, Injector, runInInjectionContext, signal, WritableSignal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SaveSlotService } from '../../../saveslot/services/save-slot-service';
import { ProfilesService } from '../../../profile/services/profiles-service';
import { FlagSwitchEntry, Profile } from '../../../profile/models/profile';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, Field } from '@angular/forms/signals';
import { ProfileFlagControl } from "../profile-flag-control/profile-flag-control";
import { ProfileSwitchControl } from '../profile-switch-control/profile-switch-control';


export type FlagEntry = { key: string; type: string; value: any };
export type FlagsModel = { flags: Record<string, FlagEntry[]>, switches: Record<string, SwitchEntry> };
export type SwitchEntry = { selected: string }

type DraftsModel = {
  flags: Record<string, Record<string, any>>;
  switches: Record<string, string>;
}

type EditMeta = { value: any, dirty: boolean }
type ModifiedItems = { flags: Set<string>, switches: Set<string> }

@Component({
  selector: 'app-editor-tab',
  standalone: true,
  imports: [Field],
  templateUrl: './editor-tab.html',
  styleUrl: './editor-tab.scss',
})
export class EditorTab {
  saveSlotService = inject(SaveSlotService);
  profilesService = inject(ProfilesService);
  formBuilder = inject(FormBuilder);

  flagsModel = signal<FlagsModel>({ flags: {}, switches: {} });
  flagsForm = form(this.flagsModel);

  modifiedItems$ = signal<ModifiedItems>({ flags: new Set<string>(), switches: new Set<string>() });
  edits: WritableSignal<Record<string, Record<string, EditMeta>>> = signal({});

  activeProfile = toSignal(this.profilesService.getActiveProfile$());
  saveSlotData = toSignal(this.saveSlotService.saveSlotData$);

  isLoaded = computed(() => this.activeProfile() && this.saveSlotData());

  formGroup: FormGroup;

  constructor(private injector: Injector) {
    this.formGroup = this.formBuilder.group({
      flags: this.formBuilder.group({})
    });

    this.profilesService.getActiveProfile$().subscribe(() => this.handleDataChange());
    this.saveSlotService.saveSlotData$.subscribe(() => this.handleDataChange());

    this.handleDataChange();
  }

  private createFlagsModel(flags: Record<string, Record<string, any>>, switches: Record<string, SwitchEntry>) {
    const flagsEntry: Record<string, FlagEntry[]> = {};
    const switchesEntry: Record<string, SwitchEntry> = {};
    const result: FlagsModel = { flags: flagsEntry, switches: switchesEntry };

    Object.keys(flags).forEach(key => {
      flagsEntry[key] = Object.entries(flags[key]).map(([entryKey, value]) => ({
        key: entryKey,
        type: this.detectType(value),
        value
      }))
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

  saveFlag(key: string) {
    const unsavedFlags = this.modifiedItems$().flags;

    if(!unsavedFlags.has(key)) {
      return;
    }

    const flagEnties = this.flagsModel().flags[key];

    const newValues: Record<string, any> = {};
    flagEnties.forEach(fe => {
      newValues[fe.key] = fe.value;
    });

    this.saveSlotService.applyFlag(key, newValues);
    this.removeUpdatedFlag(key);
  }

  saveSwitch(key: string) {
    const unsavedSwitches = this.modifiedItems$().switches;

    if(!unsavedSwitches.has(key)) {
      return;
    }

    const activeProfile = this.activeProfile()?.data;

    if(!activeProfile) {
      return;
    }

    const targetSwitch = activeProfile.switches.find(f => f.name == key);

    if(!targetSwitch) {
      return;
    }

    const targetSwitchValue = this.flagsModel().switches[key].selected;

    const switchOption = targetSwitch.options.find(o => o.value == targetSwitchValue);

    if(!switchOption) {
      return;
    }

    const targetSwitchFlagsValues: Record<string, Record<string, any>> = {};

    for(let switchSetter of switchOption.setters) {
      const innerRecord: Record<string, any> = {};
      
      for(let [k,v] of Object.entries(switchSetter.flagEntriesValues)) {
        innerRecord[k] = v;
      }

      targetSwitchFlagsValues[switchSetter.key] = innerRecord;
    }

    this.saveSlotService.applyFlags(targetSwitchFlagsValues);
    this.removeUpdatedSwitch(key);
  }

  removeUpdatedFlag(key: string) {
    const modifiedItems = this.modifiedItems$();

    if (!modifiedItems.flags.has(key)) {
      return;
    }

    const newFlags = new Set(modifiedItems.flags);
    newFlags.delete(key);
    this.modifiedItems$.update(mi => ({ ...mi, flags: newFlags }));
  }

  removeUpdatedSwitch(key: string) {
    const modifiedItems = this.modifiedItems$();

    if (!modifiedItems.switches.has(key)) {
      return;
    }

    const newSwitches = new Set(modifiedItems.switches);
    newSwitches.delete(key);
    this.modifiedItems$.update(mi => ({ ...mi, switches: newSwitches }));
  }

  isFlagUpdated(key: string) {
    return this.modifiedItems$().flags.has(key);
  }
  isSwitchUpdated(key: string) {
    return this.modifiedItems$().switches.has(key);
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
        .map((s) => [s.name, {} as SwitchEntry])
    )

    this.flagsModel.set(this.createFlagsModel(flags, switches));

    runInInjectionContext(this.injector, () => {
      this.flagsForm = form(this.flagsModel);
    });
  }
  handleFlagDataChange(flag: string) {
    if (!this.flagsModel().flags[flag]) {
      return;
    }

    const modifiedItems = this.modifiedItems$();

    if (modifiedItems.flags.has(flag)) {
      return;
    }

    const newFlags = new Set(modifiedItems.flags);
    newFlags.add(flag);
    this.modifiedItems$.update(mi => ({ ...mi, flags: newFlags }));
  }
  handleSwitchChange(switchEntry: FlagSwitchEntry) {
    if (!this.flagsModel().switches[switchEntry.name]) {
      return;
    }

    const modifiedItems = this.modifiedItems$();

    if (modifiedItems.switches.has(switchEntry.name)) {
      return;
    }

    const newSwitches = new Set(modifiedItems.switches);
    newSwitches.add(switchEntry.name);
    this.modifiedItems$.update(mi => ({ ...mi, switches: newSwitches }));
  }
}