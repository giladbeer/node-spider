import { Page } from 'puppeteer';
import { ScrapedRecord, ScraperSettingsGroups } from './types';
import {
  getSettingsGroupForUrl,
  getSelectorMatches,
  getSelectorMetadata,
  removeExcludedElements
} from './utils/scraping';
import { uniq, withoutTrailingSlash } from './utils';
import { getContentMatchLevel, getLevelWeight } from './hierarchy';
import { md5 } from './utils/hashing';
import { EventService } from './EventService';
import { Logger } from './Logger';

interface PageScraperOptions {
  onStart?: () => void | Promise<void>;
  onFinish?: (args: {
    scrapedRecords: ScrapedRecord[];
    scrapedLinks: string[];
  }) => void | Promise<void>;
  onAbort?: () => void | Promise<void>;
  stopSignal?: () => boolean;
  settings: ScraperSettingsGroups;
  excludeSelectors?: string[];
}

export class PageScraper {
  private readonly onStart?: () => void | Promise<void>;
  private readonly onFinish?: (args: {
    scrapedRecords: ScrapedRecord[];
    scrapedLinks: string[];
  }) => void | Promise<void>;
  private readonly onAbort?: () => void | Promise<void>;
  private readonly stopSignal?: () => void;
  private readonly settings: ScraperSettingsGroups;
  private readonly excludeSelectors?: string[];
  private readonly eventService: EventService;
  private readonly logger: Logger;

  constructor(options: PageScraperOptions) {
    this.onStart = options.onStart;
    this.onFinish = options.onFinish;
    this.onAbort = options.onAbort;
    this.stopSignal = options.stopSignal;
    this.settings = options.settings;
    this.excludeSelectors = options.excludeSelectors;
    this.eventService = EventService.getInstance();
    this.logger = Logger.getInstance();
  }

  public async scrapePage({
    page,
    data: { url, userAgent, respectRobotsMeta }
  }: {
    page: Page;
    data: { url: string; userAgent?: string; respectRobotsMeta?: boolean };
  }) {
    try {
      url = url
        .replace('www.', '')
        .replace(/\?(.)*/, '')
        .replace(/#(.)*/, '');
      this.onStart?.();
      if (this.stopSignal?.()) {
        this.onAbort?.();
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
      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      await page.goto(url);
      this.eventService.fireEvent('SCRAPER.URL.VISITED', { url });

      let skipCrawling = false;
      if (respectRobotsMeta) {
        skipCrawling = await page.evaluate((robotsSelector: string) => {
          return Array.from(document.querySelectorAll(robotsSelector)).some(
            (element) => {
              return (element as any)?.content?.includes('noindex');
            }
          );
        }, "head > meta[name='robots']");
      }

      if (!skipCrawling) {
        const scraperPageSettings = getSettingsGroupForUrl(this.settings, url);
        this.logger.debug(
          `Retrieved scraper page settings`,
          JSON.stringify(scraperPageSettings || {})
        );

        if (this.excludeSelectors) {
          this.logger.debug(
            `Removing excluded selectors from DOM`,
            JSON.stringify(this.excludeSelectors || {})
          );
          await page.evaluate(removeExcludedElements, {
            exclude: this.excludeSelectors
          });
          this.logger.debug(
            `Successfully removed excluded selectors`,
            JSON.stringify(this.excludeSelectors || {})
          );
        }
        await page.exposeFunction('uniq', uniq);
        const { selectorMatches, selectorMatchesByLevel, title } =
          await page.evaluate(getSelectorMatches, {
            settingsGroup: scraperPageSettings
          });
        this.logger.debug(`Page title`, title);
        this.logger.debug(
          `Page selector matches`,
          JSON.stringify(selectorMatches || {})
        );
        this.logger.debug(
          `Page selector matches by level`,
          JSON.stringify(selectorMatchesByLevel || {})
        );
        const metadata = await page.evaluate(getSelectorMetadata, {
          settingsGroup: scraperPageSettings
        });
        this.logger.debug(`Page metadata`, JSON.stringify(metadata || {}));
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
            contentMatch
            //  && !this.shouldExcludeResult?.(contentMatch)
          ) {
            const level = getContentMatchLevel(
              contentMatch,
              selectorMatchesByLevel
            );
            hierarchy[level] = contentMatch;
            if (!scraperPageSettings.onlyContentLevel || level === 'content') {
              records.push({
                uniqueId: md5(`${url}${contentMatch}`),
                url,
                content: contentMatch,
                title,
                hierarchy: { ...hierarchy },
                metadata,
                weight: {
                  level: getLevelWeight(level),
                  pageRank: scraperPageSettings.pageRank || 0
                }
              });
            }
          }
        });

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
        this.logger.debug(`Page links`, allLinks);
        if (this.onFinish) {
          this.logger.debug(`Page scraped`, JSON.stringify(records || {}));
          this.onFinish({ scrapedRecords: records, scrapedLinks: allLinks });
        }
      } else {
        // skip crawling this page
        this.logger.warn(
          `Page scraping skipped for ${url} (respecting "noindex" in robots meta tag)`
        );
        if (this.onFinish) {
          this.onFinish({ scrapedRecords: [], scrapedLinks: [] });
        }
      }
    } catch (error) {
      console.log(error);
      this.logger.error(`error scraping url ${url}`, error);
    }
  }
}
