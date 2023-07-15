import { Cluster } from 'puppeteer-cluster';
import { TaskFunction } from 'puppeteer-cluster/dist/Cluster';

interface ClusterProxyOptions<T, S> {
  concurrency?: number;
  maxConcurrency?: number;
  timeout?: number;
  taskFunction?: TaskFunction<T, S>;
  taskCompletedCallback?: (args: S) => Promise<void>;
}

export class ClusterProxy<T, S> {
  private cluster: Cluster | undefined;
  private readonly maxConcurrency: number;
  private readonly timeout?: number;
  private queueSize: number;
  private successfulJobCount: number;
  private _isStopping: boolean;
  private taskFunction!: TaskFunction<T, S>;
  public taskCompletedCallback?: (args: S) => Promise<void>;

  constructor(options: ClusterProxyOptions<T, S>) {
    this.queueSize = 0;
    this.successfulJobCount = 0;
    this._isStopping = false;
    this.maxConcurrency = options?.maxConcurrency || 1;
    if (options?.timeout) {
      this.timeout = options?.timeout;
    }
    if (options?.taskFunction) {
      this.taskFunction = options?.taskFunction;
    }
    this.taskCompletedCallback = options?.taskCompletedCallback;
  }

  public setTaskFunction(f: TaskFunction<T, S>) {
    this.taskFunction = f;
    if (this.cluster) {
      this.cluster.task(f);
    }
  }

  public setTaskCompletedCallback(callback: (args: S) => Promise<void>) {
    this.taskCompletedCallback = callback;
  }

  public async launch() {
    if (!this.cluster) {
      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: this.maxConcurrency,
        ...(this.timeout && {
          timeout: this.timeout
        })
      });
      await this.cluster.task(this.taskFunction);
    }
  }

  public async wait() {
    await this.cluster?.idle();
    await this.cluster?.close();
  }

  public stop() {
    this._isStopping = true;
  }

  public isStopping() {
    return this._isStopping;
  }

  public onTaskStarted() {
    this.queueSize--;
  }

  public async onTaskCompleted(args: S) {
    this.successfulJobCount++;
    if (this.taskCompletedCallback) {
      await this.taskCompletedCallback(args);
    }
  }

  queue(data: T) {
    if (!this._isStopping) {
      this.queueSize++;
      this.cluster?.queue({
        ...data,
        cluster: this
      });
    }
  }
}
