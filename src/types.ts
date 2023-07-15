import type { DiagnosticsService } from './DiagnosticsService';
import type { Logger, LogLevel } from './Logger';
import type { SearchPluginOptions } from './search-plugins/interfaces';

/**
 * hierarchy selectors. Essentially a mapping from html selectors to indexed hierarchy levels:
 * - l0 - level 0 selectors, e.g. ***"span[class='myclass'], .myclass2"***
 * - l1 - level 1 selectors, e.g. ***"span[class='myclass'], .myclass2"***
 * - l2 - level 2 selectors, e.g. ***"span[class='myclass'], .myclass2"***
 * - l3 - level 3 selectors, e.g. ***"span[class='myclass'], .myclass2"***
 * - l4 - level 4 selectors, e.g. ***"span[class='myclass'], .myclass2"***
 * - content - content level selectors, e.g. ***"span[class='myclass'], .myclass2"***
 */
export interface HierarchySelectors {
  /** level 0 selectors ***e.g. "span[class='myclass'], .myclass2"*** */
  l0: string;
  /** level 1 selectors */
  l1?: string;
  /** level 2 selectors */
  l2?: string;
  /** level 3 selectors */
  l3?: string;
  /** level 4 selectors */
  l4?: string;
  /** content level selectors */
  content?: string;
}

export interface MetadataSelectors {
  [key: string]: string;
}

export type Level = keyof HierarchySelectors & string;

/**
 * a group of a scraper settings - mostly hierarchy and metadata selectors, grouped by a specific URL pattern
 */
export interface ScraperPageSettings {
  /** hierarchy selectors. Essentially a mapping from html selectors to indexed hierarchy levels */
  hierarchySelectors?: HierarchySelectors;
  /** metadata selectors. Mapping from html selectors to custom additional fields in the index, e.g. can scrape meta tags of a certain content pattern and store under a custom field */
  metadataSelectors?: MetadataSelectors;
  /** the url pattern to which this selector set config should apply */
  urlPattern?: string;
  /** custom page rank for the specified url pattern */
  pageRank?: number;
  /** when set to true, only 'content' matches will be indexed */
  onlyContentLevel?: boolean;
  /** custom user agent to set when running puppeteer */
  userAgent?: string;
  /** basic auth credentials */
  basicAuth?: {
    user: string;
    password: string;
  };
  /** request headers to include when crawling the site */
  headers?: Record<string, string>;
  /** list of html selectors to exclude from being scraped */
  excludeSelectors?: string[];
  /** whether or not the crawler should respect 'noindex' meta tag */
  respectRobotsMeta?: boolean;
}

/**
 * all of the scraper settings groups (each group except the default ties to a specific URL pattern)
 */
export interface ScraperSettings {
  /** shared scraper settings group */
  shared: Omit<ScraperPageSettings, 'urlPattern'>;
  /** the default scraper settings group */
  default: Omit<ScraperPageSettings, 'urlPattern'>;
  [name: string]: ScraperPageSettings;
}

export interface ScrapedRecord {
  uniqueId: string;
  url: string;
  content: string;
  title: string;
  hierarchy: {
    l0?: string;
    l1?: string;
    l2?: string;
    l3?: string;
    l4?: string;
    content: string;
  };
  weight?: {
    level?: number;
    pageRank?: number;
  };
  metadata?: Record<string, string>;
}

/**
 * instantiates a Spider object, initializing it based on your config file and settings, then invoking its `crawl` method.
 */
export interface SpiderOptions {
  /** list of urls that the crawler will start from */
  startUrls: string | string[];
  /** list of allowed domains. When not specified, defaults to the domains of your startUrls */
  allowedDomains?: string | string[];
  /** list of url patterns to ignore */
  ignoreUrls?: string[];
  /** maximum concurrent puppeteer clusters to run */
  maxConcurrency?: number;
  /** custom user agent to set when running puppeteer */
  userAgent?: string;
  /** html selectors for telling the crawler which content to scrape for indexing */
  scraperSettings: ScraperSettings;
  /** search engine settings */
  searchEngineOpts?: SearchPluginOptions;
  /** log level */
  logLevel?: LogLevel;
  /** Logger instance */
  logger?: Logger;
  /** whether or not to output diagnostics */
  diagnostics?: boolean;
  /** path to the file where diagnostics will be written to */
  diagnosticsFilePath?: string;
  /** Diagnostics service instance */
  diagnosticsService?: DiagnosticsService;
  /** timeout (ms) */
  timeout?: number;
  /** maximum number of records to index. If reached, the crawling jobs will terminate */
  maxIndexedRecords?: number;
  /** minimum word length to index */
  minResultLength?: number;
  /** predicate for excluding a result from being indexed. Returns true if the result should be excluded */
  shouldExcludeResult?: (content: string) => boolean;
  /** whether or not the spider should follow links in the initial page(s). Defaults to true */
  followLinks?: boolean;
}

export type CrawlSiteOptionsCrawlerConfig = Pick<
  SpiderOptions,
  | 'allowedDomains'
  | 'maxConcurrency'
  | 'scraperSettings'
  | 'startUrls'
  | 'userAgent'
  | 'ignoreUrls'
  | 'diagnostics'
  | 'diagnosticsFilePath'
  | 'timeout'
  | 'maxIndexedRecords'
  | 'minResultLength'
  | 'logLevel'
  | 'followLinks'
>;
