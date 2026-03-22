import { Injectable, signal } from '@angular/core';
import { Profile, RemoteProfile, SessionProfile, StoredProfile } from '../models/profile';
import localforage from 'localforage';
import { BehaviorSubject, catchError, finalize, firstValueFrom, from, map, mergeMap, Observable, of, ReplaySubject, shareReplay, take, tap, toArray } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface StateData {
  lastProfile: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfilesService {
  private readonly STORED_KEY = 'storedProfiles';
  private readonly REMOTE_KEY = 'remoteProfiles';
  private readonly STATE_DATA_KEY = 'state';

  private storedProfiles = new Map<string, StoredProfile>();
  private remoteProfiles = new Map<string, RemoteProfile>();

  private sessionMap = new Map<string, SessionProfile>();
  private session$ = new BehaviorSubject<SessionProfile[]>([]);
  private activeProfile$ = new BehaviorSubject<SessionProfile | undefined>(undefined);

  constructor(private http: HttpClient) {
    localforage.config({
      name: "ns-editor",
      storeName: "profiles_store"
    })
  }

  getAll$(): Observable<SessionProfile[]> {
    return this.session$.asObservable();
  }

  getProfile$(alias: string): Observable<SessionProfile | undefined> {
    return this.session$.pipe(
      map(list => list.find(sp => sp.alias == alias))
    );
  }

  getActiveProfile$(): Observable<SessionProfile | undefined> {
    return this.activeProfile$.asObservable();
  }

  setActiveProfile$(alias: string | undefined) {
    if(!alias) {
      this.activeProfile$.next(undefined);
      return;
    }

    let targetProfile = this.sessionMap.get(alias);

    if(!targetProfile) {
      this.activeProfile$.next(undefined);
      return;
    }

    if(targetProfile.status == 'idle') {
      this.fetchRemoteProfile(targetProfile.alias).subscribe(p => { 
        this.activeProfile$.next(p);
      });
      return;
    }

    this.activeProfile$.next(targetProfile);
  }

  async init(): Promise<void> {
    const stored = (await localforage.getItem<StoredProfile[]>(this.STORED_KEY)) ?? [];
    stored.forEach(s => this.storedProfiles.set(s.alias, s));

    const remotes = (await localforage.getItem<RemoteProfile[]>(this.REMOTE_KEY)) ?? [];
    remotes.forEach(r => this.remoteProfiles.set(r.alias, r));

    this.rebuildSession();
  }

  private rebuildSession() {
    this.sessionMap.clear();

    for (const [alias, sp] of this.storedProfiles.entries()) {
      this.sessionMap.set(alias, {
        alias,
        source: 'stored',
        data: sp.data,
        status: 'loaded',
        persistedAs: 'stored'
      });
    }

    for (const [alias, rp] of this.remoteProfiles.entries()) {
      this.sessionMap.set(alias, {
        alias,
        source: 'remote',
        src: rp.src,
        status: 'idle',
        persistedAs: 'remote'
      });
    }

    this.emitSession();
  }

  private emitSession() {
    this.session$.next(Array.from(this.sessionMap.values()));
    var activeProfile = this.activeProfile$.getValue();
    if(activeProfile) {
      this.setActiveProfile$(activeProfile.alias);
    }
  }

  private async persistStoredProfiles() {
    await localforage.setItem(this.STORED_KEY, Array.from(this.storedProfiles.values()));
  }
  private async persistRemoteProfiles() {
    await localforage.setItem(this.REMOTE_KEY, Array.from(this.remoteProfiles.values()));
  }

  async addStoredProfile(sp: StoredProfile): Promise<boolean> {
    const alias = sp.alias;

    if (this.storedProfiles.has(alias) || this.remoteProfiles.has(alias)) {
      return false;
    }

    this.storedProfiles.set(alias, sp);
    this.sessionMap.set(alias, {
      alias,
      source: 'stored',
      data: sp.data,
      status: 'loaded',
      persistedAs: 'stored'
    });
    await this.persistStoredProfiles();
    this.emitSession();

    return true;
  }

  async addRemoteProfile(rp: RemoteProfile, autoFetch = true, callback: (() => void) | undefined = undefined): Promise<boolean> {
    const alias = rp.alias;
    if (this.storedProfiles.has(alias) || this.remoteProfiles.has(alias)) {
      return false;
    }
    this.remoteProfiles.set(alias, rp);
    // update session
    this.sessionMap.set(alias, {
      alias,
      source: 'remote',
      src: rp.src,
      status: 'idle',
      persistedAs: 'remote'
    });
    await this.persistRemoteProfiles();
    this.emitSession();
    if (autoFetch) {
      var fetchObs = this.fetchRemoteProfile(alias);

      if (callback) {
        callback();
      }
    }

    return true;
  }

  async removeProfile(alias: string) {
    this.storedProfiles.delete(alias);
    this.remoteProfiles.delete(alias);
    this.sessionMap.delete(alias);
    await Promise.all([this.persistStoredProfiles(), this.persistRemoteProfiles()]);
    this.emitSession();
  }

  fetchRemoteProfile(alias: string): Observable<SessionProfile> {
    const rp = this.remoteProfiles.get(alias);
    if (!rp) {
      const current = this.sessionMap.get(alias) ?? {
        alias,
        source: 'remote',
        status: 'error',
        error: 'No remote pointer found'
      } as SessionProfile;
      this.sessionMap.set(alias, current);
      this.emitSession();
      return of(current);
    }

    const loadingState: SessionProfile = {
      alias,
      source: 'remote',
      src: rp.src,
      status: 'loading',
      persistedAs: 'remote'
    };
    this.sessionMap.set(alias, loadingState);
    this.emitSession();

    return this.http.get<Profile>(rp.src).pipe(
      take(1),
      tap(profileData => {
        const loaded: SessionProfile = {
          alias,
          source: 'remote',
          src: rp.src,
          data: profileData,
          status: 'loaded',
          lastFetched: Date.now(),
          persistedAs: 'remote'
        };

        this.sessionMap.set(alias, loaded);
        this.emitSession();
      }),
      map(() => this.sessionMap.get(alias)!),
      catchError(err => {
        const errorMessage = err?.message ?? 'Fetch failed';
        const errored: SessionProfile = {
          alias,
          source: 'remote',
          src: rp.src,
          status: 'error',
          error: errorMessage,
          persistedAs: 'remote'
        };
        this.sessionMap.set(alias, errored);
        this.emitSession();
        return of(errored);
      }),
      finalize(() => {
        this.persistRemoteProfiles().catch(() => {});
      })
    );
  }

  fetchAllRemoteProfiles(): Observable<SessionProfile[]> {
    const tasks = Array.from(this.remoteProfiles.keys()).map(alias => this.fetchRemoteProfile(alias));
    return from(Promise.all(tasks.map(obs => firstValueFrom(obs)))).pipe(
      map(res => res as SessionProfile[])
    );
  }

  async persistFetchedRemoteAsStored(alias: string) {
    const session = this.sessionMap.get(alias);
    if (!session || !session.data) throw new Error('No fetched data available for alias ' + alias);
    const sp: StoredProfile = { alias, data: session.data };
    this.storedProfiles.set(alias, sp);
    const updated: SessionProfile = { ...session, persistedAs: 'stored', source: 'stored' };
    this.sessionMap.set(alias, updated);
    await this.persistStoredProfiles();
    this.emitSession();
  }

  async exportAll(): Promise<{ stored: StoredProfile[]; remote: RemoteProfile[] }> {
    return {
      stored: Array.from(this.storedProfiles.values()),
      remote: Array.from(this.remoteProfiles.values())
    };
  }

  async importAll(payload: { stored?: StoredProfile[]; remote?: RemoteProfile[] }) {
    if (payload.stored) {
      for (const sp of payload.stored) {
        await this.addStoredProfile(sp);
      }
    }
    if (payload.remote) {
      for (const rp of payload.remote) {
        await this.addRemoteProfile(rp, true);
      }
    }
  }
}
