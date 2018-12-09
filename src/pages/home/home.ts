import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ViewController, AlertController, PopoverController } from 'ionic-angular';
import { Pages } from '../../utils/constants';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker,
  Environment,
  LatLng,
  MarkerIcon
} from '@ionic-native/google-maps';

import { UserDataProvider } from '../../providers/userData/userData';
import { Subscription, Observable } from 'rxjs';
import { Geolocation } from '@ionic-native/geolocation';
import { UtilitiesProvider } from '../../providers/utilities/utilities';
import { LocationProvider } from '../../providers/location/location';
import { Location } from '../../models/users/location.interface';
import { PopoverComponent } from '../../components/popover/popover';
import { AuthProvider } from '../../providers/auth/auth';
import { User } from '../../models/users/user.interface';
import { MapProvider } from '../../providers/map/map'
import { _ParseAST } from '@angular/compiler';
import { AngularFirestore } from 'angularfire2/firestore';
import { DatePipe } from '@angular/common';


/**
 * Generated class for the HomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  map: GoogleMap;
  mapview: string;
  profileImage: string;
  profileImage$: Subscription;
  userProfile: User;
  userProfile$: Subscription;
  userlocation: Location[];
  userLocations$: Subscription;
  markers: Marker[];
  timePipe = new DatePipe('en-US');
  markerUser$: Subscription;
  userDict = new Map<string, Marker>();  

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public modal: ModalController,
    private data: UserDataProvider,
    public utilities: UtilitiesProvider,
    public alert: AlertController,
    private geo: Geolocation,
    public locSrvc: LocationProvider,
    public popoverCtrl: PopoverController,
    private auth: AuthProvider,
    private mapProvider: MapProvider,
    private afs: AngularFirestore,
    private view: ViewController
  ) {
  }

  friendsClicked() {
    this.navCtrl.push(Pages.FRIENDS_PAGE);
  }

  dashboardClicked() {
    this.navCtrl.push(Pages.DASHBOARD_PAGE);
  }

  logoutConfirm() {
    this.utilities.confirmAlert('Logout', 'Are you sure?', async () => {
      await this.auth.logout();
      
      this.view.dismiss({ logout: true });
    });
  }

  ionViewDidLoad() {
    this.loadMap();
    this.data.updateLastLogin();
  }

  ionViewWillLoad() {
    this.mapview = 'all';

    this.updateProfileMsgs();
  }

  ionViewWillLeave() {
    if (this.profileImage$)
      this.profileImage$.unsubscribe();
    if (this.userLocations$)
      this.userLocations$.unsubscribe();
  }

  /**
   * Loads google maps based on users current location
   *
   * @memberof HomePage
   */
  async loadMap() {

    try {
      let user: User = await this.auth.getAuthenticatedUser();

      Environment.setEnv({
        'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyCO8ryKRAkT2zPwSJLWJQKsQVr-JHSqAYY',
        'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyCO8ryKRAkT2zPwSJLWJQKsQVr-JHSqAYY'
      });

      let position = await this.geo.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      });

      let location: Location = {
        uid: user.uid,
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        timestamp: position.timestamp
      };

      this.locSrvc.postMostRecentUserLocation(location);
      this.locSrvc.postUserLocationHistory(location);

      let mapOptions: GoogleMapOptions = {
        camera: {
          target: {
            lat: location.lat,
            lng: location.lon
          },
          zoom: 18,
          tilt: 0
        }
      };

      this.map = GoogleMaps.create('map_canvas', mapOptions);


      let marker: Marker = this.map.addMarkerSync({
        title: 'My Location',
        icon: 'blue',
        animation: 'DROP',
        position: {
          lat: location.lat,
          lng: location.lon
        }
      });

      marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
        // Do something here on marker click
      });

      this.map.on(GoogleMapsEvent.MAP_READY).subscribe(() => {
        this.displayAllUserMarkers();
      });

    } catch (e) {
      this.utilities.showToast(e.message);
    }

  }

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverComponent);
    popover.present({
      ev: myEvent
    });
  }

  /**
   * Profile Page click event
   *
   * @memberof HomePage
   */
  public openProfileModal() {
    let profileModal = this.modal.create(Pages.MODAL_PROFILE);
    profileModal.onDidDismiss((logout) => { if (logout) this.navCtrl.setRoot(Pages.LOGIN_PAGE) });
    profileModal.present();

  }

  /**
   * Updates profile image on load
   *
   * @memberof HomePage
   */
  async updateProfileMsgs() {
    if (await this.data.profileExists()) {
      this.profileImage$ = (await this.data.getAuthenticatedUserProfileRealTime())
        .subscribe((profile) => this.profileImage = profile.profileImage);
    }
  }

  /* Combine all of them */
  displayAllFriendsMarkers() {

  }

  displayAllFamilyMarkers() {

  }

  async displayAllUserMarkers() {

    let userID = await this.auth.getUserUID();  

    try {
      this.userLocations$ = (await this.mapProvider.getAllUserLocations())
        .subscribe((location) => {
          location.forEach((data) => {

            if (userID != data.uid) {

              this.markerUser$ = this.afs.collection<User>('users', ref => ref
                .where('uid', '==', data.uid))
                .valueChanges()
                .subscribe((profile) => {
                  profile.forEach((userSnap) => {

                    if (this.userDict.has(userSnap.uid)) {
                      this.userDict.get(userSnap.uid).remove();
                    }

                    let time = this.timePipe.transform((new Date).getTime() - data.timestamp, 'h');

                    let mapIcon: MarkerIcon = {
                      url: userSnap.profileImage,
                      size: {
                        width: 32,
                        height: 32
                      }
                    }

                    let marker: Marker = this.map.addMarkerSync({
                      title: `${userSnap.firstName} ${userSnap.lastName}`,
                      snippet: `${time} hours ago`,
                      icon: mapIcon,
                      animation: 'DROP',
                      zIndex: 3,
                      position: {
                        lat: data.lat,
                        lng: data.lon
                      }
                    });

                    marker.on(GoogleMapsEvent.MARKER_CLICK).subscribe(() => {
                      //alert('User Clicked');
                      // Do something here
                    });
                    
                    this.userDict.set(userSnap.uid, marker);
                  })
                })

            } else {
              console.log('Error with Map Marker insertion!')
            }

          });
        });

    } catch (e) {
      console.log(e.message);
    }
  }

}


  //  The below function wont work for real time tracking and updating. Snapshots can't 
  //  be subscribed to.

  //  The above method uses observables so we can subscribe and update their location
  //  automatically when the data changes in firebase ... lets just hope it works!

  //     let userDoc = await this.afs.firestore.collection<Location[]>(`locations`);

  // try {

  //   userDoc.get().then((querySnapshot) => {
  //     querySnapshot.forEach((doc) => {
  //       this.userlocation = {
  //         uid: doc.data().uid,
  //         lat: doc.data().lat,
  //         lon: doc.data().lon,
  //         timestamp: doc.data().timestamp
  //       };
  //       console.log(JSON.stringify(this.userlocation));
  //     });
  //   });

  // } catch (e) {
  //   console.log(e.message);
  // }
  //   }
