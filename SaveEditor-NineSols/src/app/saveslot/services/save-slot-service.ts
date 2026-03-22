import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, shareReplay, Subscription } from 'rxjs';
import { SaveFileService } from '../../filework/services/save-file-service';
import { SaveMetatada } from '../models/Metadata';
import { isMPValue, MPType, MPValue, ReadingService } from '../../filework/encoding/reading-service';
import { WritingService } from '../../filework/encoding/writing-service';

interface MPTypeTreeNode {
  key: string;
  type: MPType;
  prefix: number;
}

export interface SerializedSaveData {
  version: number;
  meta: SaveMetatada;
  flagDict: Record<string, Record<string, any>>;
}

export type Flags = Record<string, Record<string, any>>;

@Injectable({
  providedIn: 'root'
})
export class SaveSlotService {
  private _saveSlotData$ = new BehaviorSubject<SerializedSaveData | null>(null)
  readonly saveSlotData$ = this._saveSlotData$.asObservable().pipe(shareReplay(1));

  private _resultSaveData$ = new BehaviorSubject<SerializedSaveData | null>(null);
  readonly resultSaveData$ = this._resultSaveData$.asObservable().pipe(shareReplay(1));

  private flagsTypeTree: Record<string, Record<string, { type:MPType, prefix: number }>> = {};

  get saveSlotDataSnapshot(): SerializedSaveData | null { return this._saveSlotData$.getValue(); }
  get resultSlotDataSnapshot(): SerializedSaveData | null { return this._resultSaveData$.getValue(); }

  async createFileBlob(): Promise<Blob | null> {
    if(!this.saveSlotDataSnapshot) {
      return null;
    }

    const writingService = new WritingService();

    var mpModel = this.buildMPModel(this.saveSlotDataSnapshot);
    console.log(mpModel);
    writingService.writeValue(mpModel);
    const encoded = writingService.build();
    console.log(encoded);

    var stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    })

    const cs = new window.CompressionStream('deflate-raw');
    const compressedBlob = await new Response(stream.pipeThrough(cs)).blob();
    return compressedBlob;
  }

  async loadFromFile(file: File | null): Promise<void> {
    if (!file) {
      return;
    }

    if (!window.DecompressionStream) {
      throw new Error('DecompressionStream is not supported');
    }

    const ds = new window.DecompressionStream('deflate-raw');
    const decompressedArrayBuffer = await new Response(file.stream().pipeThrough(ds)).arrayBuffer();
    const content = new Uint8Array(decompressedArrayBuffer);

    const readingService = new ReadingService(content);
    const saveFileMPModel = readingService.decode();
    
    if(!this.validateSaveFileModel(saveFileMPModel)) {
      throw new Error("Structure of your save file doesn't match intended save file structure");
    }

    this.buildMPTypeTree(saveFileMPModel);

    const saveFileModel = this.convertToSaveDataModel(saveFileMPModel);

    console.log(saveFileModel);

    this._saveSlotData$.next(saveFileModel);
  }

  buildMPModel(saveModel: SerializedSaveData) {
    const versionNode: MPValue = { tag: 0x01, type: 'uint', value: 1 };
    const metaNode: MPValue = { tag: 0x00, type: 'str', value: JSON.stringify(saveModel.meta) };
    const flagsNode: MPValue = this.buildMPFlags(saveModel.flagDict);
    const rootArray: MPValue = { tag: 0x93, type: 'array', value: [versionNode, metaNode, flagsNode] };

    return rootArray;
  }
  buildMPFlags(saveFlags: Record<string, Record<string, any>>): MPValue {
    const mpFlags: Record<string, MPValue> = {};

    for(const flagKey of Object.keys(saveFlags)) {
      const flag = saveFlags[flagKey];
      const flagMVValues: Record<string, MPValue> = {};

      for(const valueKey of Object.keys(flag)) {
        const flagValue = flag[valueKey];
        const valueMPType = this.flagsTypeTree[flagKey][valueKey];
        flagMVValues[valueKey] = { tag: valueMPType.prefix, type: valueMPType.type, value: flagValue }; 
      }

      mpFlags[flagKey] = { tag: 0x00, type: 'map', value: flagMVValues };
    }

    return { tag: 0x00, type: 'map', value: mpFlags };
  }

  convertToSaveDataModel(rootNode: MPValue): SerializedSaveData {
    const [versionNode, metaNode, flagsNode] = rootNode.value as MPValue[];
    const version = versionNode.value as number;
    const metadata = JSON.parse(metaNode.value) as SaveMetatada;
    const flagDict: Record<string, Record<string, any>> = {};

    for(const flagKey of Object.keys(flagsNode.value)) {
      const flagRecord: Record<string, any> = {};
      const flagFields: Record<string, MPValue> = flagsNode.value[flagKey].value;

      for(const flagFieldKey of Object.keys(flagFields)) {
        const flagField = flagFields[flagFieldKey];

        flagRecord[flagFieldKey] = flagField.value;
      }

      flagDict[flagKey] = flagRecord;
    }

    return { version: version, meta: metadata, flagDict: flagDict };
  }
  validateSaveFileModel(rootNode: MPValue) {
    if(!Array.isArray(rootNode.value)) {
      return false;
    }

    const rootArray = rootNode.value as MPValue[];
    if(rootArray.length != 3) {
      return false;
    }
    
    const [versionNode, metaNode, flagsNode] = rootArray;
    
    if(versionNode.type !== 'uint' || typeof(versionNode.value) !== 'number') {
      return false;
    }

    if(metaNode.type !== 'str' || typeof(metaNode.value) !== 'string') {
      return false;
    }

    if(flagsNode.type !== 'map' || !this.validateFlagsModel(flagsNode.value)) {
      return false;
    }

    return true;
  }
  validateFlagsModel(flagsObj: unknown) {
    if(typeof flagsObj !== 'object' || flagsObj === null || Array.isArray(flagsObj)) return false;

    if(Object.prototype.toString.call(flagsObj) !== '[object Object]') return false;

    return Object.keys(flagsObj).every((k) => {
      if (!Object.prototype.hasOwnProperty.call(flagsObj, k)) return false;
      return isMPValue((flagsObj as any)[k]);
    })
  }
  buildMPTypeTree(flagsRoot: MPValue) {
    const [version, meta, flags] = flagsRoot.value;
    const flagsObj = flags.value as Record<string, MPValue>;
    const flagsTypeTree: Record<string, Record<string, { type:MPType, prefix: number }>> = {};

    for(const flagKey of Object.keys(flagsObj)) {
      const flagRecord: Record<string, { type:MPType, prefix: number }> = {};
      const flagFields: Record<string, MPValue> = flagsObj[flagKey].value;

      for(const flagFieldKey of Object.keys(flagFields)) {
        const flagField = flagFields[flagFieldKey];

        flagRecord[flagFieldKey] = { type: flagField.type, prefix: flagField.tag };
      }

      flagsTypeTree[flagKey] = flagRecord;
    }

    this.flagsTypeTree = flagsTypeTree;
  }

  applyFlags(flags: Flags) {
    if (!this.saveSlotDataSnapshot) {
      return;
    }

    var snapshot = this.saveSlotDataSnapshot;

    for (const [flagKey, flagValues] of Object.entries(flags)) {
      for (const [valueKey, value] of Object.entries(flagValues)) {
        snapshot.flagDict[flagKey][valueKey] = value;
      }
    }

    this._saveSlotData$.next(snapshot)
  }

  applyFlag(flag: string, values: Record<string, any>) {
    if (!this.saveSlotDataSnapshot) {
      return;
    }

    var snapshot = this.saveSlotDataSnapshot;
    snapshot.flagDict[flag] = values;

    this._saveSlotData$.next(snapshot);
  }

  applyFlagValue(flagKey: string, valueKey: string, value: any) {

  }
}
