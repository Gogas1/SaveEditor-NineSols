import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { CustomReuseStrategy } from './shared/routing/custom-reuse-strategy';
import { RemoteProfile } from './profile/models/profile';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
  ]
};

export const editorConfig: {
  defaultProfiles: RemoteProfile[],
  profilesKey: string,
} = {

  defaultProfiles: [
    {
      alias: "bosses",
      src: "https://raw.githubusercontent.com/Gogas1/SaveEditor-NineSols/refs/heads/main/profiles/bosses.json?v=1"
    },
    {
      alias: "general",
      src: "https://raw.githubusercontent.com/Gogas1/SaveEditor-NineSols/refs/heads/main/profiles/general.json?v=1"
    }
  ],
  profilesKey: "storedProfiles"
};