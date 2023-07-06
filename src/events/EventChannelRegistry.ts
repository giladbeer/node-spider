import { EventChannel } from './EventChannel';
import { IEventService } from './IEventService';

export class EventChannelRegistry {
  private static instance?: EventChannelRegistry;
  private eventService: IEventService;
  private channels: Record<string, EventChannel<unknown>>;

  private constructor(eventService: IEventService) {
    this.eventService = eventService;
    this.channels = {};
  }

  static getInstance(eventService: IEventService) {
    if (!EventChannelRegistry.instance) {
      EventChannelRegistry.instance = new EventChannelRegistry(eventService);
    }
    return EventChannelRegistry.instance;
  }

  public channel<T>(name: string): EventChannel<T> {
    if (this.channels[name]) {
      return this.channels[name] as EventChannel<T>;
    }
    this.channels[name] = new EventChannel<T>(name, this.eventService);
    return this.channels[name] as EventChannel<T>;
  }
}
