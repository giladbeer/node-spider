import { IEventChannel } from './IEventChannel';

export interface IEventService {
  fireEvent: <T>(eventName: string, eventData?: T) => void;
  subscribe: (eventName: string, callback: (...args: any[]) => void) => void;
  unsubscribe: (eventName: string, callback: (...args: any[]) => void) => void;
  unsubscribeAll: (eventName: string) => void;
  channel: <T>(channelName: string) => IEventChannel<T>;
}
