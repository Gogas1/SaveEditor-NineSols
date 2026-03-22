export interface Profile {
    name: string;
    flags: flagEntry[];
    switches: FlagSwitchEntry[];
}

export interface flagEntry {
    key: string;
    name: string;
    desc: string;
}

export interface FlagSwitchEntry {
    name: string;
    desc: string;
    options: FlagSwitchOption[];
}

interface FlagSwitchOption {
    name: string;
    value: string;
    setters: FlagSetterOptions[];
}

interface FlagSetterOptions {
    key: string;
    flagEntriesValues: Record<string, any>
}

export interface RemoteProfile {
    alias: string;
    src: string;
}

export interface StoredProfile {
    alias: string;
    data: Profile;
}

type Source = 'stored' | 'remote';

type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface SessionProfile {
  alias: string;
  source: Source;
  src?: string;
  data?: Profile;
  status: ProfileStatus;
  error?: string;
  lastFetched?: number;
  persistedAs?: 'stored' | 'remote' | null;
}