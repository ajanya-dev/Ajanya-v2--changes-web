import { Channel } from 'pusher-js';

export interface IPusher {
  /**
   *
   * @param channelName
   * @description
   * Subscribe the pusher service
   */
  subscribePusher(channelName: string): Channel;
  /**
   *
   * @param channelName
   * @param eventName
   * @description
   * To Get the event
   */
  getEvent(channelName: string, eventName: string): any;
}

export interface IPusherEvent<T = any> {
  event: T;
}
