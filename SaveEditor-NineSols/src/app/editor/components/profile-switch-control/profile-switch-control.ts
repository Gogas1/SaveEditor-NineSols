import { Component, input, model, ModelSignal, OnChanges, output, SimpleChanges } from '@angular/core';
import { FlagSwitchEntry } from '../../../profile/models/profile';
import { FormValueControl, Field } from '@angular/forms/signals';

@Component({
  selector: 'app-profile-switch-control',
  imports: [],
  templateUrl: './profile-switch-control.html',
  styleUrl: './profile-switch-control.scss',
})
export class ProfileSwitchControl implements FormValueControl<string> {
  flagEntry = input.required<FlagSwitchEntry>();
  value: ModelSignal<string> = model.required();
  stateSwitched = output<string>();

  onSwitchChange(target: EventTarget | null) {
    if(!target) {
      return;
    }

    var selectEl = target as HTMLSelectElement;
    var value = selectEl.value;

    this.value.set(value);
    this.stateSwitched.emit(this.value());
  }
}
