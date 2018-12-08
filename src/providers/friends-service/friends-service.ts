import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { AuthProvider } from '../auth/auth';
import { User } from '../../models/users/user.interface';
import { FriendRequest } from '../../models/users/friendRequest.interface';
import { Observable } from 'rxjs';
import { UtilitiesProvider } from '../utilities/utilities';
import { UserDataProvider } from '../userData/userData';

@Injectable()
export class FriendsServiceProvider {

  constructor(private afs: AngularFirestore, private auth: AuthProvider,
    private alertControl: UtilitiesProvider,
    private data: UserDataProvider) {
    console.log('Hello FriendsServiceProvider Provider');
  }

  /**
   * gets the list of all users in an array
   *
   * @returns
   * @memberof FriendsServiceProvider
   */
  async getFriendsList() {
    let user = await this.auth.getAuthenticatedUser();
    return await this.afs.collection<User>(`users/${user.uid}/friends/`).valueChanges();
  }

  /**
   * returns all pending friends requests in a users collection
   *
   * @returns {Promise<Observable<FriendRequest[]>>}
   * @memberof FriendsServiceProvider
   */
  async getAllFriendRequestsInbox(): Promise<Observable<FriendRequest[]>> {
    let user = await this.auth.getAuthenticatedUser();

    return this.afs.collection<FriendRequest>(`users/${user.uid}/requestsIn`).valueChanges();
  }

  /**
   * accepts the users friend request and deletes the entry from database
   *
   * @param {FriendRequest} request
   * @memberof FriendsServiceProvider
   */
  async onFriendRequestAccept(sender: User) {
    let user = await this.auth.getAuthenticatedUser();
    try {
      // Add users to eachothers friends lists
      await this.afs.doc(`users/${sender.uid}/friends/`).set(user.uid);
      await this.afs.doc(`users/${user.uid}/friends/`).set(sender.uid);
      await this.deleteFriendRequest(sender, user);
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  /**
   * declines the users friend request and deletes the entry from database
   *
   * @param {FriendRequest} request
   * @memberof FriendsServiceProvider
   */
  async onFriendRequestDecline(sender: User) {
    let user = await this.auth.getAuthenticatedUser();
    try {
      await this.deleteFriendRequest(sender, user);
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  
  /**
   * Removes pending friend requests from the senders and receivers subcollection
   *
   * @param {FriendRequest} request
   * @memberof FriendsServiceProvider
   */
  async deleteFriendRequest(sender: User, receiver: User) {
    // Removes freind request from the SENDERS database
    await this.afs.collection(`users/${sender.uid}/requestsOut`, ref => ref
      .where('toID', '==', receiver.uid)).valueChanges().subscribe(requests => {
        requests.map((thisRequest: FriendRequest) => {
          this.afs.doc(`users/${sender.uid}/requestsOut/${thisRequest.toID}`).delete();
        })
      }).unsubscribe();

    // Removes friend request from the RECEIVERS database
    await this.afs.collection(`users/${receiver.uid}/requestsOut`, ref => ref
      .where('toID', '==', sender.uid)).valueChanges().subscribe(requests => {
        requests.map((thisRequest: FriendRequest) => {
          this.afs.doc(`users/${receiver.uid}/requestsOut/${thisRequest.fromID}`).delete();
        })
      }).unsubscribe();
  }

  /**
   * Attempts to send a friend request to receiver, first checking to ensure receiver does not
   * already have a pending request from the sender.
   *
   * @param {User} receiver
   * @memberof FriendsServiceProvider
   */
  async sendFriendRequestToUser(receiver: User) {
    let sender: User = await this.auth.getAuthenticatedUser();
    let senderProfile = await this.data.getAuthenticatedUserProfile();

    let thisRequest: FriendRequest = {
      fromName: senderProfile.firstName + " " + senderProfile.lastName,
      fromID: sender.uid, 
      toID: receiver.uid, 
      status: 0 
    };

    console.log(JSON.stringify(senderProfile));

    let isFriend: boolean = false;
    let requests$ = this.afs.collection(`users/${receiver.uid}/requestsIn`)
      .valueChanges().subscribe((requests: FriendRequest[]) => {
        requests.forEach(request => {
          if (request.fromID === sender.uid)
            isFriend = true;
        });
      });

    requests$.unsubscribe();

    if (!isFriend) {
      await this.afs.doc<FriendRequest>(`users/${receiver.uid}/requestsIn/${sender.uid}`).set(thisRequest);
      await this.afs.doc<FriendRequest>(`users/${sender.uid}/requestsOut/${receiver.uid}`).set(thisRequest);
      this.alertControl.showToast('Friend request sent!');
    }
    else
      this.alertControl.showToast('Already awaiting a response for pending request.');
  }
}