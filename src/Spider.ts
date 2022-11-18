import { Cluster } from 'puppeteer-cluster';
import { DiagnosticsService } from './DiagnosticsService';
import { Logger, LogLevel } from './Logger';
import { SearchPlugin, SearchPluginOptions } from './search-plugins/interfaces';
import { getPlugin } from './search-plugins/pluginRegistry';
import { uniq, urlToDomain, withoutTrailingSlash } from './utils';

export interface SelectorSet {
  l0?: string;
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
  content: string;
  urlPattern?: string;
}

export interface Selectors {
  default: Omit<SelectorSet, 'urlPattern'>;
  [name: string]: SelectorSet;
}

export interface SpiderOptions {
  startUrls: string | string[];
  allowedDomains?: string | string[];
  ignoreUrls?: string[];
  maxConcurrency?: number;
  userAgent?: string;
  selectors: Selectors;
  searchEngineOpts?: SearchPluginOptions;
  logLevel?: LogLevel;
  logger?: Logger;
  diagnostics?: boolean;
  diagnosticsFilePath?: string;
  diagnosticsService?: DiagnosticsService;
  timeout?: number;
}

export class Spider {
  startUrls: string[];
  ignoreUrls: string[];
  allowedDomains: string[];
  maxConcurrency: number;
  userAgent?: string;
  visitedUrls: string[];
  selectors: Selectors;
  searchPlugin?: SearchPlugin;
  logger: Logger;
  diagnostics?: boolean;
  diagnosticsService?: DiagnosticsService;
  timeout?: number;
  remainingQueueSize: number;
  scrapedUrls: number;
  indexedRecords: number;

  constructor(opts: SpiderOptions) {
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
    if (opts.userAgent) {
      this.userAgent = opts.userAgent;
    }
    this.visitedUrls = [];
    this.selectors = opts.selectors;
    this.logger = opts.logger || Logger.getInstance(opts.logLevel);
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
    this.remainingQueueSize = 0;
    this.scrapedUrls = 0;
    this.indexedRecords = 0;
  }

  registerSearchPlugin(options: SearchPluginOptions) {
    this.searchPlugin = getPlugin(options);
    this.logger.debug(
      'successfully registered search plugin',
      Object.keys(options).find((engineName) => !!engineName)
    );
    this.diagnosticsService?.addStat({
      name: `searchEngine > totalErrors`,
      num: 0
    });
    this.diagnosticsService?.addStat({
      name: `searchEngine > indexedRecords`,
      num: 0
    });
  }

  async crawl() {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: this.maxConcurrency,
      ...(this.timeout && {
        timeout: this.timeout
      })
    });

    await cluster.task(async ({ page, data: url }) => {
      try {
        this.remainingQueueSize--;
        this.logger.debug(`Scraping URL ${url}`);
        if (this.userAgent) {
          await page.setUserAgent(this.userAgent);
        }
        await page.goto(url);
        this.diagnosticsService?.addStat({ name: `scrapedPages > ${url}` });

        const selectorSet =
          Object.values(this.selectors).find((set) => {
            const pattern = set.urlPattern;
            if (!pattern) {
              return false;
            }
            if (withoutTrailingSlash(url).match(pattern)) {
              return true;
            }
          }) || this.selectors.default;

        this.logger.debug(`Using selector set ${selectorSet}`);

        const content = await page.evaluate((selectorSet: SelectorSet) => {
          // TODO - consider l0 - l4 !!!
          const contentMatches = Array.from(
            document.querySelectorAll(selectorSet['content'])
          ).map((node) => (node as any).innerText);
          return contentMatches;
        }, selectorSet);

        const records =
          content?.map((text: string) => ({
            url,
            content: text
          })) || [];
        this.diagnosticsService?.addStat({
          name: `scrapedPages > ${url} > scrapedContent`,
          num: records.length || 0,
          additionalData: JSON.stringify(records)
        });

        this.logger.debug(`scraped records ${records}`);
        if (this.searchPlugin) {
          this.logger.debug(`attempting to index records`);
          try {
            await this.searchPlugin.addRecords(records);
            this.logger.debug(`successfully indexed records`);
            this.diagnosticsService?.addStat({
              name: `scrapedPages > ${url} > indexedContent`,
              num: records.length || 0,
              additionalData: JSON.stringify(records)
            });
            this.diagnosticsService?.incrementStat(
              `searchEngine > indexedRecords`,
              records.length || 0
            );
            this.indexedRecords += records.length || 0;
          } catch (error) {
            this.logger.error(`failed to indexed records`, error);
            this.diagnosticsService?.incrementStat(
              `searchEngine > totalErrors`
            );
          }
        }
        const allLinks = uniq(
          (
            await page.evaluate((resultsSelector: string) => {
              return Array.from(document.querySelectorAll(resultsSelector)).map(
                (anchor) => {
                  return (anchor as HTMLAnchorElement).href;
                }
              );
            }, 'a')
          )?.map((link) => withoutTrailingSlash(link))
        );
        this.logger.debug(`found links`, allLinks);
        const linksToCrawl = allLinks.filter(
          (link: string) =>
            !this.ignoreUrls.find((ignoredUrl) => !!link.match(ignoredUrl)) &&
            !this.visitedUrls.includes(link) &&
            this.allowedDomains.includes(urlToDomain(link))
        );
        this.logger.debug(`marked links for crawling`, linksToCrawl);
        this.diagnosticsService?.addStat({
          name: `scrapedPages > ${url} > numLinks`,
          num: allLinks.length
        });
        linksToCrawl.forEach((link: string) => {
          this.visitedUrls.push(link);
          cluster.queue(link);
          this.remainingQueueSize++;
        });
        this.scrapedUrls++;
        this.logger.debug(`finished scraping url ${url}`, {
          remainingQueueSize: this.remainingQueueSize,
          totalScrapedPages: this.scrapedUrls,
          totalIndexedRecords: this.indexedRecords
        });
      } catch (error) {
        this.logger.error(`error scraping url ${url}`, error);
      }
    });

    this.startUrls.forEach((url) => {
      this.visitedUrls.push(withoutTrailingSlash(url));
      cluster.queue(url);
      this.remainingQueueSize++;
    });

    await cluster.idle();
    await cluster.close();
    this.diagnosticsService?.writeAllStats();
  }
}
