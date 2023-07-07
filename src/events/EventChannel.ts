import { IEventService } from './IEventService';
import { IEventChannel } from './IEventChannel';

export class EventChannel<T> implements IEventChannel<T> {
  private name: string;
  private eventService: IEventService;

  constructor(name: string, eventService: IEventService) {
    this.name = name;
    this.eventService = eventService;
  }

  public subscribe(callback: (data: T) => void) {
    this.eventService.subscribe(`CHANNEL::${this.name}`, callback);
  }

  public publish(data: T) {
    this.eventService.fireEvent(`CHANNEL::${this.name}`, data);
  }
}
