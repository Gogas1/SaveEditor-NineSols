import { MPValue } from "./reading-service";

export class WritingService {
    textEncoder = new TextEncoder();

    u8: Uint8Array;
    dv: DataView;
    pos = 0;

    constructor(initialLength = 1024) {        
        this.u8 = new Uint8Array(initialLength);
        this.dv = new DataView(this.u8.buffer);
    }

    private ensure(need: number) {
        const want = this.pos + need;
        if(want <= this.u8.length) return;

        let newLen = want;
        if(newLen > this.u8.length) {
            newLen *= 2;
        }

        const newU8 = new Uint8Array(newLen);
        newU8.set(this.u8);
        this.dv = new DataView(newU8.buffer);
        this.u8 = newU8;
    }

    public writeValue(value: MPValue) {
        switch(value.type) {
            case 'uint': { this.resolveUInt(value); return; } 
            case 'int': { this.resolveInt(value); return; }
            case 'float': { this.resolveFloat(value); return; }
            case 'bool': { this.resolveBool(value); return; }
            case 'nil': { this.resolveNil(value); return; }
            case 'str': { this.resolveStr(value); return; }
            case 'bin': { this.resolveBin(value); return; }
            case 'array': { this.resolveArray(value); return; }
            case 'map': { this.resolveMap(value); return; }
            default: return;
        }
    }

    public build(): Uint8Array {
        return new Uint8Array(this.u8.buffer, 0, this.pos);
    }

    private resolveUInt(value: MPValue) {
        const tag = value.tag;
        switch(tag) {
            case 0xcc: { this.writeUInt8(0xcc); this.writeUInt8(value.value); return; }
            case 0xcd: { this.writeUInt8(0xcd); this.writeUInt16(value.value); return; }
            case 0xce: { this.writeUInt8(0xce); this.writeUInt32(value.value); return; }
        }

        if(tag >= 0x00 && tag <= 0x7f) {
            this.writeUInt8(value.value & 0x7f);
        }
    }
    private resolveInt(value: MPValue) {
        const tag = value.tag;
        switch(tag) {
            case 0xd0: { this.writeUInt8(0xd0); this.writeInt8(value.value); return; }
            case 0xd1: { this.writeUInt8(0xd1); this.writeInt16(value.value); return; }
            case 0xd2: { this.writeUInt8(0xd2); this.writeInt32(value.value); return; }
            case 0xd3: { this.writeUInt8(0xd3); this.writeInt64(value.value); return; }
        }

        if(tag >= 0xe0 && tag <= 0xff) {
            this.writeUInt8((value.value & 0x1f) | 0xe0);
        }
    }
    private resolveFloat(value: MPValue) {
        const tag = value.tag;
        switch(tag) {
            case 0xca: { this.writeUInt8(0xca); this.writeFloat32(value.value); return; }
            case 0xcb: { this.writeUInt8(0xcb); this.writeFloat64(value.value); return; }
        }
    }
    private resolveBool(value: MPValue) {
        const boolVal = value.value as boolean;
        if(boolVal) {
            this.writeTrue();
        } else {
            this.writeFalse();
        }
    }
    private resolveNil(value: MPValue) {
        this.writeUInt8(0xc0);
    }
    private resolveStr(value: MPValue) {
        this.writeString(value.value as string);
    }
    private resolveBin(value: MPValue) {
        const bytes = value.value as Uint8Array;
        
        if(bytes.length <= (2**8)-1) {
            this.writeUInt8(0xc4);
            this.writeUInt8(bytes.length);
        }
        else if(bytes.length <= (2**16)-1) {
            this.writeUInt8(0xc5);
            this.writeUInt16(bytes.length);
        }
        else if(bytes.length <= (2**32)-1) {
            this.writeUInt8(0xc6);
            this.writeUInt32(bytes.length);
        } else {
            return;
        }
        this.writeBytes(bytes);
    }
    private resolveArray(value: MPValue) {
        const array: MPValue[] = value.value;
        
        if(array.length <= 15) {
            this.writeUInt8(array.length | 0x90);
        }
        else if(array.length <= (2**16)-1) {
            this.writeUInt8(0xdc);
            this.writeUInt16(array.length);
            return;
        }
        else if(array.length <= (2**32)-1) {
            this.writeUInt8(0xdd);
            this.writeUInt32(array.length);
            return;
        } else {
            return;
        }

        for(let value of array) {
            this.writeValue(value);
        } 
    }
    private resolveMap(value: MPValue) {
        const obj: Record<string, MPValue> = value.value;
        const keys = Object.keys(obj);
        const len = keys.length;

        if(len <= 15) {
            this.writeUInt8(len | 0x80);
        }
        else if(len <= (2**16)-1) {
            this.writeUInt8(0xde);
            this.writeUInt16(len);
        }
        else if(len <= (2**32)-1) {
            this.writeUInt8(0xdf);
            this.writeUInt32(len);
        } else {
            return;
        }

        for(const key of keys) {
            this.writeString(key);
            this.writeValue(obj[key]);
        }
    }

    private writeUInt8(value: number) { this.ensure(1); this.dv.setUint8(this.pos, value); this.pos++; }
    private writeUInt16(val: number) { this.ensure(2); this.dv.setUint16(this.pos, val); this.pos += 2; }
    private writeUInt32(val: number) { this.ensure(4); this.dv.setUint32(this.pos, val); this.pos += 4; }

    private writeInt8(value: number) { this.ensure(1); this.dv.setInt8(this.pos, value); this.pos++; }
    private writeInt16(val: number) { this.ensure(2); this.dv.setInt16(this.pos, val); this.pos += 2; }
    private writeInt32(val: number) { this.ensure(4); this.dv.setInt32(this.pos, val); this.pos += 4; }
    private writeInt64(val: bigint) { this.ensure(8); this.dv.setBigInt64(this.pos, val); this.pos += 8; }

    private writeFloat32(val: number) { this.ensure(4); this.dv.setFloat32(this.pos, val); this.pos += 4; }
    private writeFloat64(val: number) { this.ensure(8); this.dv.setFloat64(this.pos, val); this.pos += 8; }

    private writeFalse() { this.ensure(1); this.dv.setUint8(this.pos, 0xc2); this.pos++; }
    private writeTrue() { this.ensure(1); this.dv.setUint8(this.pos, 0xc3); this.pos++; }

    private writeString(val: string) {
        const bytes = this.textEncoder.encode(val);
        if(bytes.length <= 31) {
            this.writeUInt8((bytes.length & 0x1f) | 0xa0);
        }
        else if(bytes.length <= (2**8)-1) {
            this.writeUInt8(0xd9);
            this.writeUInt8(bytes.length);
        }
        else if(bytes.length <= (2**16)-1) {
            this.writeUInt8(0xda);
            this.writeUInt16(bytes.length);
        }
        else if(bytes.length <= (2**32)-1) {
            this.writeUInt8(0xdb);
            this.writeUInt32(bytes.length);
        } else {
            return;
        }
        
        this.writeBytes(bytes);
    }

    private writeBytes(bytes: Uint8Array) {
        this.ensure(bytes.length);
        this.u8.set(bytes, this.pos);
        this.pos += bytes.length;
    }
}