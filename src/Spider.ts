import { DiagnosticsService } from './DiagnosticsService';
import { Logger } from './Logger';
import { SearchPlugin, SearchPluginOptions } from './search-plugins/interfaces';
import { getPlugin } from './search-plugins/pluginRegistry';
import { ScrapedRecord, ScraperSettings, SpiderOptions } from './types';
import {
  uniq,
  urlToDomain,
  withoutTrailingSlash,
  formatDuration
} from './utils';
import { ClusterProxy } from './ClusterProxy';
import { PageScraper } from './PageScraper';

interface SpiderState {
  visitedUrls: string[];
  remainingQueueSize: number;
  scrapedUrls: number;
  indexedRecords: number;
  lastStartTime?: number;
  stopping: boolean;
}

export class Spider {
  state: SpiderState;
  cluster!: ClusterProxy<any, any>;

  readonly startUrls: string[];
  readonly ignoreUrls: string[];
  readonly allowedDomains: string[];
  readonly maxConcurrency: number;
  readonly scraperSettings: ScraperSettings;
  readonly timeout?: number;
  readonly maxIndexedRecords?: number;
  readonly minResultLength?: number;
  readonly followLinks?: boolean;

  searchPlugin?: SearchPlugin;
  logger: Logger;
  diagnostics?: boolean;
  diagnosticsService?: DiagnosticsService;

  shouldExcludeResult?: (content: string) => boolean;

  constructor(opts: SpiderOptions) {
    this.state = {
      visitedUrls: [],
      remainingQueueSize: 0,
      scrapedUrls: 0,
      indexedRecords: 0,
      stopping: false
    };
    if (typeof opts.startUrls === 'string') {
      this.startUrls = [opts.startUrls];
    } else if (typeof opts.startUrls === 'object') {
      this.startUrls = opts.startUrls;
    } else {
      this.startUrls = [];
    }
    if (typeof opts.allowedDomains === 'string') {
      this.allowedDomains = [opts.allowedDomains];
    } else {
      this.allowedDomains =
        opts.allowedDomains || uniq(this.startUrls.map(urlToDomain));
    }
    this.maxConcurrency = opts.maxConcurrency || 1;
    this.scraperSettings = opts.scraperSettings;
    this.logger =
      opts.logger || Logger.getInstance({ logLevel: opts.logLevel });
    if (opts.searchEngineOpts) {
      this.registerSearchPlugin(opts.searchEngineOpts);
    }
    this.diagnostics =
      opts.diagnostics ||
      !!opts.diagnosticsFilePath ||
      !!opts.diagnosticsService;
    this.diagnosticsService = this.diagnostics
      ? opts.diagnosticsService ||
        DiagnosticsService.getInstance(opts.diagnosticsFilePath)
      : undefined;
    this.timeout = opts.timeout || 0;
    this.ignoreUrls = opts.ignoreUrls?.map(withoutTrailingSlash) || [];

    if (opts.maxIndexedRecords) {
      this.maxIndexedRecords = opts.maxIndexedRecords;
    }
    this.shouldExcludeResult = opts.shouldExcludeResult;
    if (opts.minResultLength) {
      this.minResultLength = opts.minResultLength;
    }
    this.followLinks = opts.followLinks === false ? false : true;
  }

  registerSearchPlugin(options: SearchPluginOptions) {
    this.searchPlugin = getPlugin(options);
    this.logger.debug('successfully registered search plugin', options.engine);
    this.diagnosticsService?.addStat({
      name: `searchEngine > totalErrors`,
      num: 0
    });
    this.diagnosticsService?.addStat({
      name: `searchEngine > indexedRecords`,
      num: 0
    });
  }

  async onPageScraped({
    scrapedRecords,
    scrapedLinks
  }: {
    scrapedRecords: ScrapedRecord[];
    scrapedLinks: string[];
  }) {
    try {
      if (this.searchPlugin) {
        let recordsToAdd = scrapedRecords;
        const isMaxIndexedRecords =
          this.maxIndexedRecords || this.maxIndexedRecords === 0 ? true : false;
        if (isMaxIndexedRecords) {
          const remainingSpace = Math.max(
            (this.maxIndexedRecords || 0) - this.state.indexedRecords,
            0
          );
          recordsToAdd = recordsToAdd.slice(0, remainingSpace);
        }
        await this.searchPlugin.addRecords(recordsToAdd);
        this.state.indexedRecords += recordsToAdd.length;
        if (
          isMaxIndexedRecords &&
          this.state.indexedRecords + scrapedRecords.length >=
            (this.maxIndexedRecords || 0)
        ) {
          this.logger.warn(
            `reached max indexed records at ${this.maxIndexedRecords} - stopping...`
          );
          this.cluster.stop();
          return;
        }
      }
      if (this.followLinks) {
        const linksToCrawl = scrapedLinks.filter(
          (link: string) =>
            !this.ignoreUrls.find((ignoredUrl) => !!link.match(ignoredUrl)) &&
            !this.state.visitedUrls.includes(link) &&
            this.allowedDomains.includes(urlToDomain(link))
        );
        linksToCrawl.forEach((link: string) => {
          this.state.visitedUrls.push(link);
          this.cluster.queue({ url: link });
          this.state.remainingQueueSize++;
        });
      }
      this.logger.debug(
        `Page indexing done!\n ${JSON.stringify(
          {
            remainingQueueSize: this.state.remainingQueueSize,
            totalScrapedPages: ++this.state.scrapedUrls,
            totalIndexedRecords: this.state.indexedRecords
          },
          undefined,
          4
        )}`
      );
    } catch (error) {
      this.logger.error('onPageScraped error', error);
    }
  }

  async crawl() {
    this.state.stopping = false;
    if (this.searchPlugin?.init) {
      await this.searchPlugin.init();
    }
    this.state.lastStartTime = Date.now();
    this.cluster = new ClusterProxy({
      maxConcurrency: this.maxConcurrency,
      timeout: this.timeout
    });
    const pageScraper = new PageScraper({
      onStart: this.cluster.onTaskStarted,
      onFinish: this.onPageScraped.bind(this),
      stopSignal: this.cluster.isStopping.bind(this.cluster),
      settings: this.scraperSettings
    });
    this.cluster.setTaskFunction(pageScraper.scrapePage.bind(pageScraper));
    await this.cluster.launch();
    this.startUrls.forEach((url) => {
      this.state.visitedUrls.push(withoutTrailingSlash(url));
      this.cluster.queue({ url });
    });
    await this.cluster.wait();

    if (this.searchPlugin) {
      await this.searchPlugin.finish();
    }
    this.logger.debug(
      `Done!\n ${JSON.stringify(
        {
          remainingQueueSize: this.state.remainingQueueSize,
          totalScrapedPages: this.state.scrapedUrls,
          totalIndexedRecords: this.state.indexedRecords,
          duration: formatDuration(Date.now() - this.state.lastStartTime)
        },
        undefined,
        4
      )}`
    );
    this.diagnosticsService?.writeAllStats();
  }
}
