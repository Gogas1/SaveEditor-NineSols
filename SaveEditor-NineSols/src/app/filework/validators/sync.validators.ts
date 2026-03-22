import { AbstractControl, ValidationErrors } from "@angular/forms";

export function fileValidator(maxSizeBytes: number) {
    return (control: AbstractControl): ValidationErrors | null => {
        const file = control.value as File | null;
        if(!file) return null;
        if(file.size > maxSizeBytes) {
            return { maxSizeFile: { actual: file.size, max: maxSizeBytes } };
        }

        return null;
    }
}