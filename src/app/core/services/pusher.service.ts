import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import Pusher from 'pusher-js';
import { Channel } from 'pusher-js';
import { IPusher, IPusherEvent } from 'src/app/modules/auth/model/pusher';
import { Observable, Subject } from 'rxjs';

/**
 * @description Service for working with Pusher.
 * @implements {IPusher}
 */
@Injectable({
  providedIn: 'root'
})
export class PusherService implements IPusher {
  private _pusherClient: Pusher;
  private _subject: Subject<IPusherEvent> = new Subject<IPusherEvent>();

  /**
   * Initializes the Pusher client instance.
   */
  constructor() {
    this._pusherClient = new Pusher(environment.pusher.key, {
      cluster: environment.pusher.cluster
    });
  }

  /**
   * Subscribes to a Pusher channel.
   * @param {string} channelName - The name of the channel to subscribe to.
   * @returns {Channel} - The subscribed channel.
   */
  subscribePusher(channelName: string): Channel {
    return this._pusherClient.subscribe(channelName);
  }

  /**
   * Unsubscribes from a Pusher channel.
   * @param {string} channelName - The name of the channel to unsubscribe from.
   */
  unsubscribePusher(channelName: string): void {
    this._pusherClient.unsubscribe(channelName);
  }

  /**
   * Unsubscribes header notification and signed-receipt channels for a user session.
   */
  unsubscribeUserSessionChannels(
    userId: string | number | null | undefined
  ): void {
    if (userId == null || userId === '' || userId === 0 || userId === '0') {
      return;
    }
    const id = String(userId);
    this.unsubscribePusher(`user-app-notifications-${id}`);
    this.unsubscribePusher(`payment-receipt-signature-uploaded-${id}`);
  }

  /**
   * Disconnects the Pusher client (e.g. on logout).
   */
  disconnectClient(): void {
    this._pusherClient.disconnect();
  }

  /**
   * Gets an observable for a Pusher event.
   * @param {string} channelName - The name of the channel.
   * @param {string} eventName - The name of the event.
   * @returns {Observable<IPusherEvent>} - The observable for the event.
   */
  getEvent<T>(
    channelName: string,
    eventName: string
  ): Observable<IPusherEvent<T>> {
    this.subscribePusher(channelName).bind(eventName, (data: T): void => {
      this._subject.next({ event: data });
    });
    return this._subject.asObservable();
  }
}
