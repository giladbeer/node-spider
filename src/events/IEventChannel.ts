export interface IEventChannel<T> {
  publish: (data: T) => void;
  subscribe: (callback: (data: T) => void) => void;
}
