import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthProvider } from '../providers/auth/auth';
import { Storage } from '@ionic/storage';
import { UtilitiesProvider } from '../providers/utilities/utilities';
import { LoadingMessages } from '../utils/constants';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:string;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, auth: AuthProvider, public utilities: UtilitiesProvider) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();

      auth.isAuthenticated()
        .then((auth => { this.rootPage = auth ? 'HomePage' : 'IntroPage'; splashScreen.hide(); } ))
        .catch((error) => { this.rootPage = 'IntroPage'; splashScreen.hide(); })
    });
  }
}

