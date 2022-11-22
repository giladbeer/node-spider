import { Cluster } from 'puppeteer-cluster';
import { DiagnosticsService } from './DiagnosticsService';
import { getContentMatchLevel } from './hierarchy';
import { Logger } from './Logger';
import { SearchPlugin, SearchPluginOptions } from './search-plugins/interfaces';
import { getPlugin } from './search-plugins/pluginRegistry';
import { findActiveSelectorSet } from './selectors';
import { ScrapedRecord, Selectors, SpiderOptions } from './types';
import { uniq, urlToDomain, withoutTrailingSlash } from './utils';
import { getSelectorMatches } from './selectors';

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
    this.stopping = false;
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
      if (this.stopping) {
        return;
      }
      try {
        this.remainingQueueSize--;
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

        const selectorSet = findActiveSelectorSet(this.selectors, url);
        this.logger.debug(`Using selector set ${selectorSet}`);

        // const levels = Object.keys(selectorSet.hierarchy) as Level[];
        // const selectors = uniq(
        //   Object.values(selectorSet.hierarchy).join(',').split(',')
        // ).join(',');

        await page.exposeFunction('uniq', uniq);
        const { selectorMatches, selectorMatchesByLevel } = await page.evaluate(
          getSelectorMatches,
          { selectorSet }
        );
        // const { selectorMatches, selectorMatchesByLevel } = await page.evaluate(
        //   ({ selectorSet, levels }) => {
        //     const selectorMatches = Array.from(
        //       document.querySelectorAll(selectors)
        //     )
        //       .map((node) => node.textContent)
        //       .filter(Boolean);

        //     const selectorMatchesByLevel: Partial<Record<Level, string[]>> = {};
        //     levels.forEach((level) => {
        //       const selector = selectorSet.hierarchy[level];
        //       if (selector) {
        //         const levelContent = Array.from(
        //           document.querySelectorAll(selector)
        //         )
        //           .map((node) => node.textContent)
        //           .filter(Boolean);
        //         selectorMatchesByLevel[level] = levelContent as string[];
        //       }
        //     });
        //     return {
        //       selectorMatches,
        //       selectorMatchesByLevel
        //     };

        //     // TODO - consider l0 - l4 !!!
        //     // const contentMatches = Array.from(
        //     //   document.querySelectorAll(selectorSet.hierarchy.content)
        //     // ).map((node) => node.textContent);
        //     // return contentMatches;
        //   },
        //   { selectorSet, levels }
        // );

        const records: ScrapedRecord[] = [];
        selectorMatches.forEach((contentMatch) => {
          if (contentMatch) {
            const level = getContentMatchLevel(
              contentMatch,
              selectorMatchesByLevel
            );
            records.push({
              url,
              content: contentMatch,
              hierarchy: {
                l0: level === 'l0' ? contentMatch : '',
                l1: level === 'l1' ? contentMatch : '',
                l2: level === 'l2' ? contentMatch : '',
                l3: level === 'l3' ? contentMatch : '',
                l4: level === 'l4' ? contentMatch : '',
                content: level === 'content' ? contentMatch : ''
              }
            });
          }
        });

        // const records =
        //   content?.map((text) => ({
        //     url,
        //     content: text
        //   })) || [];
        let hasReachedMax = false;
        if (
          this.maxIndexedRecords &&
          this.indexedRecords + records.length >= this.maxIndexedRecords
        ) {
          hasReachedMax = true;
          records.splice(0, this.maxIndexedRecords - records.length);
        }
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

        if (hasReachedMax) {
          this.logger.debug(
            `reached maximum records (${this.maxIndexedRecords}), stopping...`
          );
          this.stopping = true;
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
    this.logger.debug(`Done!`, {
      remainingQueueSize: this.remainingQueueSize,
      totalScrapedPages: this.scrapedUrls,
      totalIndexedRecords: this.indexedRecords,
      duration: `${(Date.now() - this.lastStartTime) / (1000 * 60)} minutes`
    });
    this.diagnosticsService?.writeAllStats();
  }
}
