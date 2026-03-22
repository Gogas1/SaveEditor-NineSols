export type MPType = 'int' | 'uint' | 'float' | 'bool' | 'nil' | 'str' | 'bin' | 'map' | 'array' | 'ext'

export type MPValue = { tag: number; type: MPType, value: any }

export function isMPValue(obj: unknown) {
  return (
    typeof obj == 'object' &&
    obj != null &&
    !Array.isArray(obj) &&
    typeof (obj as any).tag === 'number' &&
    typeof (obj as any).type === 'string'
  );
}

export class ReadingService {
  textDecoder = new TextDecoder('utf-8');

  buffer: Uint8Array;
  dv: DataView;
  pos = 0;

  constructor(buf: Uint8Array) {
    this.buffer = buf;
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  eof() { return this.pos >= this.buffer.length; }
  readUInt8() { const v = this.buffer[this.pos]; this.pos++; return v; }
  readUInt16() { const v = this.dv.getUint16(this.pos); this.pos += 2; return v; }
  readUInt32() { const v = this.dv.getUint32(this.pos); this.pos += 4; return v; }

  readInt8() { const v = this.dv.getInt8(this.pos); this.pos++; return v; }
  readInt16() { const v = this.dv.getInt16(this.pos); this.pos += 2; return v; }
  readInt32() { const v = this.dv.getInt32(this.pos); this.pos += 4; return v; }
  readInt64() { const v = this.dv.getBigInt64(this.pos); this.pos += 8; return v; }

  readFloat32() { const v = this.dv.getFloat32(this.pos); this.pos += 4; return v; }
  readFloat64() { const v = this.dv.getFloat64(this.pos); this.pos += 8; return v; }

  readBytes(len: number): Uint8Array {
    const start = this.pos;
    this.pos += len;
    return this.buffer.subarray(start, start + len);
  }

  decode(): MPValue {
    if(this.eof()) throw new Error("EOF during decoding");
    const byte = this.readUInt8();

    if(byte <= 0x7f) {
      return { tag: byte, type: 'uint', value: byte };
    }

    if(byte >= 0x80 && byte <= 0x8f) {
      const len = byte & 0x0F;
      return { tag: byte, type: 'map', value: this.decodeMap(len) };
    }

    if(byte >= 0x90 && byte <= 0x9f) {
      const len = byte & 0x0F;
      return { tag: byte, type: 'array', value: this.decodeArray(len) };
    }

    if(byte >= 0xa0 && byte <= 0xbf) {
      const strLen = byte & 0x1F;
      const bytes = this.readBytes(strLen);
      return { tag: byte, type: 'str', value: this.textDecoder.decode(bytes) };
    }

    switch(byte) {
      case 0xc0: return { tag: byte, type: 'nil', value: null };
      case 0xc2: return { tag: byte, type: 'bool', value: false };
      case 0xc3: return { tag: byte, type: 'bool', value: true };
      case 0xc4: { const len = this.readUInt8(); return { tag: byte, type: 'bin', value: this.readBytes(len) }; };
      case 0xc5: { const len = this.readUInt16(); return { tag: byte, type: 'bin', value: this.readBytes(len) }; };
      case 0xc6: { const len = this.readUInt32(); return { tag: byte, type: 'bin', value: this.readBytes(len) }; };
      case 0xca: { return { tag: byte, type: 'float', value: this.readFloat32() }; }
      case 0xcb: { return { tag: byte, type: 'float', value: this.readFloat64() }; }
      case 0xcc: { return { tag: byte, type: 'uint', value: this.readUInt8() }; }
      case 0xcd: { return { tag: byte, type: 'uint', value: this.readUInt16() }; }
      case 0xce: { return { tag: byte, type: 'uint', value: this.readUInt32() }; }
      case 0xd0: { return { tag: byte, type: 'int', value: this.readInt8() }; }
      case 0xd1: { return { tag: byte, type: 'int', value: this.readInt16() }; }
      case 0xd2: { return { tag: byte, type: 'int', value: this.readInt32() }; }
      case 0xd3: { return { tag: byte, type: 'int', value: this.readInt64() }; }
      case 0xd9: { var len = this.readUInt8(); var bytes = this.readBytes(len); return { tag: byte, type: 'str', value: this.textDecoder.decode(bytes) }; };
      case 0xda: { var len = this.readUInt16(); var bytes = this.readBytes(len); return { tag: byte, type: 'str', value: this.textDecoder.decode(bytes) }; };
      case 0xdb: { var len = this.readUInt32(); var bytes = this.readBytes(len); return { tag: byte, type: 'str', value: this.textDecoder.decode(bytes) }; };
      case 0xdc: { var arrayLen = this.readUInt16(); return { tag: byte, type: 'array', value: this.decodeArray(arrayLen) }; };
      case 0xdd: { var arrayLen = this.readUInt32(); return { tag: byte, type: 'array', value: this.decodeArray(arrayLen) }; };
      case 0xde: { var arrayLen = this.readUInt16(); return { tag: byte, type: 'map', value: this.decodeMap(arrayLen) }; };
      case 0xdf: { var arrayLen = this.readUInt32(); return { tag: byte, type: 'map', value: this.decodeMap(arrayLen) }; };
      default: {
        if (byte >= 0xe0 && byte <= 0xff) {
          const iv = (byte << 24) >> 24;
          return { tag: byte, type: 'int', value: iv };
        }
        break;
      }
    }

    throw new Error(`Unsupported/unimplemented MessagePack tag: 0x${byte.toString(16)}`);
  }

  decodeMap(len: number): Record<string, MPValue> {
    const out: Record<string, MPValue> = {};

    for (let i = 0; i < len; i++) {
      const keyVal = this.decode();
      if(keyVal.type != 'str') throw new Error("Map key is not string");
      const key = keyVal.value as string;
      const val = this.decode();
      out[key] = val;
    }

    return out;
  }

  decodeArray(len: number): MPValue[] {
    const out: MPValue[] = [];
    for (let i = 0; i < len; i++) {
      out.push(this.decode());
    }

    return out;
  }
}
