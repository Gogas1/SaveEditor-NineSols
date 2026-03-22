import { Component } from '@angular/core';
import { NavigationTabsBar } from "./navigation/components/navigation-tabs-bar/navigation-tabs-bar";
import { ProfilesService } from './profile/services/profiles-service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [NavigationTabsBar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'SaveEditor-NineSols';

  constructor(private profilesService: ProfilesService) {
    profilesService.init();
  }
}
