import { EventEmitter } from 'events';

class Emitter extends EventEmitter {}

export class EventService {
  private static instance?: EventService;
  private emitter: Emitter;

  private constructor() {
    this.emitter = new Emitter();
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
}
