import { Injectable } from '@angular/core';
import { User } from '../../models/users/user.interface'
import { AngularFirestore } from 'angularfire2/firestore';
import { Geoposition } from '@ionic-native/geolocation'
import { Location } from '../../models/users/location.interface';
import { DateTime } from 'ionic-angular';
import { AuthProvider } from '../auth/auth';
import { UserDataProvider } from '../userData/userData';


/*
  Generated class for the LocationProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationProvider {

  constructor(private data: AngularFirestore, private auth: AuthProvider, private user: UserDataProvider) {
    console.log('Hello LocationProvider Provider');
  }

  async postMostRecentUserLocation(location: Location) {
    let user = await this.auth.getAuthenticatedUser();

    try {
      await this.data.doc<Location>(`locations/${user.uid}`).set(location);
    } catch (e) {
      throw e;
    }
  }

  async postUserLocationHistory(location: Location) {
    let user = await this.auth.getAuthenticatedUser();

    try {
      await this.data.doc<Location>(`users/$user.uid}/locationHistory/${location.timestamp}`).set(location);
    } catch (e) {
      throw e;
    }
  }

  /**
   * Puts users new location in 'users/latestLocation/'
   * and also adds it to 'users/previousLocations'
   *
   * @param {Geoposition} geo
   * @param {string} uid
   * @memberof LocationProvider
   */
  // async postUserLocation(geo: Geoposition, uid: string) {
  //   try {
  //     await this.data.doc(`users/${uid}`).collection('latestLocation').update({
  //       lat: geo.coords.latitude,
  //       lon: geo.coords.longitude,
  //       timestamp: (new Date).getTime()
  //     });
  //     await this.data.doc(`users/${uid}`).collection('previousLocations').add({
  //       lat: geo.coords.latitude,
  //       lon: geo.coords.longitude,
  //       timestamp: (new Date).getTime()
  //     })
  //   } catch (e) {
  //     console.log(e);
  //     throw e;
  //   }
  // }
}
