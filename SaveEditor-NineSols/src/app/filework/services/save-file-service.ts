import { Injectable, output } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { SerializedSaveData } from '../../saveslot/services/save-slot-service';

@Injectable({
  providedIn: 'root'
})
export class SaveFileService {
  private _lastFile$ = new ReplaySubject<Uint8Array>();
  readonly lastFile$ = this._lastFile$.asObservable();
  
  async submitFile(file: File | null): Promise<void> {
    if(!file) {
      return;
    }

    if(!window.DecompressionStream) {
      throw new Error('DecompressionStream is not supported');
    }

    const ds = new window.DecompressionStream('deflate-raw');
    const decompressedArrayBuffer = await new Response(file.stream().pipeThrough(ds)).arrayBuffer();
    const content = new Uint8Array(decompressedArrayBuffer);

    this._lastFile$.next(content);
  }
}
