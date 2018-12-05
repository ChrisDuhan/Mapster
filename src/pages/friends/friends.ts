import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Toast } from 'ionic-angular';
import { Pages } from '../../utils/constants';
import { FriendsProvider } from '../../providers/friends/friends'
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';

import { ToastController } from 'ionic-angular';
import { tap } from 'rxjs/operators';

/**
 * Generated class for the FriendsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-friends',
  templateUrl: 'friends.html',
})
export class FriendsPage {

  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              private data: AngularFirestore,
              public modal: ModalController,
              public friendsProv: FriendsProvider,
              public toastCtrl: ToastController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad FriendsPage');

    this.friendsProv.getToken();
    console.log('gotToken');
    this.friendsProv.listenToNotifications().pipe(
      tap(msg => {
        const toast = this.toastCtrl.create({
          message: msg.body,
          duration: 3000 //stays on screen for 3 seconds
        });
        toast.present();
      })
    )
    .subscribe()
    console.log('got past ionViewDidLoad');

  }

  public openProfileModal() {
    let profileModal = this.modal.create(Pages.MODAL_PROFILE);
    profileModal.present();
  }

  addFriendClicked() {
    this.navCtrl.push(Pages.FRIEND_SEARCH_PAGE);
  }

  acceptFriendRequest(user)
  {
    //get currUserId, fromUserId

    // //Write to users/currUserId/friends
    // // Add a new document in collection 'users/${currUserId}/friends' with ID fromUserId
    // var setDoc = this.data.collection('users/${currUserId}/friends').doc(${fromUserId}).set(user);
    
    // //Write to users/fromUserId/friends

  }

}
