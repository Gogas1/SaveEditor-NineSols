import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { fileValidator } from '../../validators/sync.validators';
import { SaveSlotService } from '../../../saveslot/services/save-slot-service';

@Component({
  selector: 'app-save-file-tab',
  imports: [ReactiveFormsModule],
  templateUrl: './save-file-tab.html',
  styleUrl: './save-file-tab.scss'
})
export class SaveFileTab {
  saveFileService = inject(SaveSlotService);
  
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      file: [null, [Validators.required, fileValidator(5_000_000)]]
    })
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if(!input.files || input.files.length === 0) {
      this.setFileControl(null);
      return;
    }

    const file = input.files[0];
    this.setFileControl(file);
  }

  private setFileControl(file: File | null) {    
    this.file!.setValue(file);
    this.file!.updateValueAndValidity();
  }

  onSubmit() {
    if(this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const file: File = this.file!.value;

    console.log(file);

    this.saveFileService.loadFromFile(file);
  }

  get file() {
    return this.form.get('file');
  }
}
