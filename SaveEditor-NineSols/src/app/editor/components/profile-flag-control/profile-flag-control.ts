import { Component, input, model, ModelSignal, OnInit } from '@angular/core';
import { flagEntry } from '../../../profile/models/profile';
import { Field, FieldTree, FormValueControl } from '@angular/forms/signals';
import { FlagEntry } from '../editor-tab/editor-tab';

@Component({
  selector: 'app-profile-flag-control',
  imports: [Field],
  templateUrl: './profile-flag-control.html',
  styleUrl: './profile-flag-control.scss',
})
export class ProfileFlagControl implements FormValueControl<FlagEntry[]> {
  profileFlagConfig = input.required<flagEntry>();
  value: ModelSignal<FlagEntry[]> = model.required();
  flagsField = input.required<FieldTree<FlagEntry[]>>();

  flagFieldValueChanged() {
    
  }
}
