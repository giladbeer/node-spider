import { Cluster } from 'puppeteer-cluster';
import { DiagnosticsService } from './DiagnosticsService';
import { getContentMatchLevel, getLevelWeight } from './hierarchy';
import { Logger } from './Logger';
import { SearchPlugin, SearchPluginOptions } from './search-plugins/interfaces';
import { getPlugin } from './search-plugins/pluginRegistry';
import {
  findActiveSelectorSet,
  getSelectorMetadata,
  removeExcludedElements
} from './selectors';
import { ScrapedRecord, Selectors, SpiderOptions } from './types';
import { uniq, urlToDomain, withoutTrailingSlash } from './utils';
import { getSelectorMatches } from './selectors';
import { md5 } from './utils/hashing';

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
  lastStartTime?: number;
  maxIndexedRecords?: number;
  stopping: boolean;
  excludeSelectors?: string[];
  respectRobotsMeta: boolean;
  minResultLength?: number;
  shouldExcludeResult?: (content: string) => boolean;

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
    if (opts.maxIndexedRecords) {
      this.maxIndexedRecords = opts.maxIndexedRecords;
    }
    if (opts.excludeSelectors) {
      this.excludeSelectors = opts.excludeSelectors;
    }
    this.stopping = false;
    this.respectRobotsMeta = opts.respectRobotsMeta || false;
    this.shouldExcludeResult = opts.shouldExcludeResult;
    if (opts.minResultLength) {
      this.minResultLength = opts.minResultLength;
    }
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
    this.stopping = false;
    if (this.searchPlugin?.init) {
      await this.searchPlugin.init();
    }
    this.lastStartTime = Date.now();
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
        if (this.stopping) {
          return;
        }
        // page
        //   .on('console', (message) => console.log(message.text()))
        //   .on('pageerror', ({ message }) => console.log(message))
        //   // .on('response', (response) =>
        //   //   console.log(`${response.status()} ${response.url()}`)
        //   // )
        //   .on('requestfailed', (request) =>
        //     console.log(`${request.failure().errorText} ${request.url()}`)
        //   );
        this.logger.debug(`Scraping URL ${url}`);
        if (this.userAgent) {
          await page.setUserAgent(this.userAgent);
        }
        await page.goto(url);
        this.diagnosticsService?.addStat({ name: `scrapedPages > ${url}` });

        let skipIndexing = false;
        if (this.respectRobotsMeta) {
          skipIndexing = await page.evaluate((metaTagSelector: string) => {
            return Array.from(document.querySelectorAll(metaTagSelector)).some(
              (element) => {
                return (element as any)?.content?.includes('noindex');
              }
            );
          }, "head > meta[name='robots']");
        }

        const selectorSet = findActiveSelectorSet(this.selectors, url);
        this.logger.debug(`Using selector set ${selectorSet}`);

        if (this.excludeSelectors) {
          this.logger.debug(
            `Removing excluded selectors from DOM`,
            this.excludeSelectors
          );
          await page.evaluate(removeExcludedElements, {
            exclude: this.excludeSelectors
          });
          this.logger.debug(
            `Successfully removed excluded selectors`,
            this.excludeSelectors
          );
        }
        await page.exposeFunction('uniq', uniq);
        const { selectorMatches, selectorMatchesByLevel, title } =
          await page.evaluate(getSelectorMatches, { selectorSet });
        const metadata = await page.evaluate(getSelectorMetadata, {
          selectorSet
        });

        const records: ScrapedRecord[] = [];
        const hierarchy: ScrapedRecord['hierarchy'] = {
          l0: '',
          l1: '',
          l2: '',
          l3: '',
          l4: '',
          content: ''
        };
        selectorMatches.forEach((contentMatch) => {
          if (
            contentMatch &&
            !(
              this.minResultLength && contentMatch.length < this.minResultLength
            ) &&
            !this.shouldExcludeResult?.(contentMatch)
          ) {
            const level = getContentMatchLevel(
              contentMatch,
              selectorMatchesByLevel
            );
            hierarchy[level] = contentMatch;
            records.push({
              uniqueId: md5(`${url}${contentMatch}`),
              url,
              content: contentMatch,
              title,
              hierarchy,
              metadata,
              weight: {
                level: getLevelWeight(level),
                pageRank: selectorSet.pageRank || 0
              }
            });
          }
        });

        let hasReachedMax = false;
        if (
          this.maxIndexedRecords &&
          this.indexedRecords + records.length >= this.maxIndexedRecords
        ) {
          hasReachedMax = true;
          records.splice(0, this.maxIndexedRecords - this.indexedRecords);
        }
        this.diagnosticsService?.addStat({
          name: `scrapedPages > ${url} > scrapedContent`,
          num: records.length || 0,
          additionalData: JSON.stringify(records)
        });

        this.logger.debug(`scraped records ${records}`);
        if (this.searchPlugin && skipIndexing) {
          this.logger.debug(
            `${url} has a "noindex" robots meta tag. Skipping indexing`
          );
        }
        if (this.searchPlugin && !skipIndexing) {
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

        if (hasReachedMax) {
          this.logger.debug(
            `reached maximum records (${this.maxIndexedRecords}), stopping...`
          );

          // tell all queued jobs to exit immediately as they start
          this.stopping = true;

          // wait for the queue to get emptied, then close the cluster
          await cluster.idle();
          await cluster.close();
          return;
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
    if (this.searchPlugin?.finish) {
      await this.searchPlugin.finish();
    }
    this.logger.debug(`Done!`, {
      remainingQueueSize: this.remainingQueueSize,
      totalScrapedPages: this.scrapedUrls,
      totalIndexedRecords: this.indexedRecords,
      duration: `${(Date.now() - this.lastStartTime) / (1000 * 60)} minutes`
    });
    this.diagnosticsService?.writeAllStats();
  }
}
