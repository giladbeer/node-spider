import { EventEmitter } from 'events';
import { IEventService } from './IEventService';
import { EventChannelRegistry } from './EventChannelRegistry';

class Emitter extends EventEmitter {}

export class EventService implements IEventService {
  private static instance?: EventService;
  private emitter: Emitter;
  private eventChannelRegistry: EventChannelRegistry;

  private constructor() {
    this.emitter = new Emitter();
    this.eventChannelRegistry = EventChannelRegistry.getInstance(this);
  }

  static getInstance() {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  public fireEvent<T>(eventName: string, eventData?: T) {
    if (eventData) {
      this.emitter.emit(eventName, eventData);
    } else {
      this.emitter.emit(eventName);
    }
  }

  public subscribe(eventName: string, callback: (...args: any[]) => void) {
    this.emitter.on(eventName, callback);
  }

  public unsubscribe(eventName: string, callback: (...args: any[]) => void) {
    this.emitter.off(eventName, callback);
  }

  public unsubscribeAll(eventName: string) {
    this.emitter.removeAllListeners(eventName);
  }

  public channel<T>(channelName: string) {
    return this.eventChannelRegistry.channel<T>(channelName);
  }
}
