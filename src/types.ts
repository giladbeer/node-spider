import type { DiagnosticsService } from './DiagnosticsService';
import type { Logger, LogLevel } from './Logger';
import type { SearchPluginOptions } from './search-plugins/interfaces';

export interface Hierarchy {
  l0?: keyof HTMLElementTagNameMap;
  l1?: keyof HTMLElementTagNameMap;
  l2?: keyof HTMLElementTagNameMap;
  l3?: keyof HTMLElementTagNameMap;
  l4?: keyof HTMLElementTagNameMap;
  content: keyof HTMLElementTagNameMap;
}

export interface Metadata {
  [key: string]: keyof HTMLElementTagNameMap;
}

export type Level = keyof Hierarchy;

export interface SelectorSet {
  /** hierarchy config. Essentially a mapping from html selectors to indexed hierarchy level */
  hierarchy: Hierarchy;
  /** metadata config. Mapping from html selectors to custom additional fields in the index, e.g. can scrape meta tags of a certain content pattern and store under a custom field */
  metadata?: Metadata;
  /** the url pattern to which this selector set config should apply */
  urlPattern?: string;
  /** custom page rank for the specified url pattern */
  pageRank?: number;
}

export interface Selectors {
  /** the default selector set config */
  default: Omit<SelectorSet, 'urlPattern'>;
  [name: string]: SelectorSet;
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
  selectors: Selectors;
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
  /** list of html selectors to exclude from being scraped */
  excludeSelectors?: string[];
  /** whether or not the crawler should respect 'noindex' meta tag */
  respectRobotsMeta?: boolean;
  /** minimum word length to index */
  minResultLength?: number;
  /** predicate for excluding a result from being indexed. Returns true if the result should be excluded */
  shouldExcludeResult?: (content: string) => boolean;
}

export type CrawlSiteOptionsCrawlerConfig = Pick<
  SpiderOptions,
  | 'allowedDomains'
  | 'maxConcurrency'
  | 'selectors'
  | 'startUrls'
  | 'userAgent'
  | 'ignoreUrls'
  | 'excludeSelectors'
  | 'respectRobotsMeta'
  | 'diagnostics'
  | 'diagnosticsFilePath'
  | 'timeout'
  | 'maxIndexedRecords'
  | 'minResultLength'
  | 'logLevel'
>;
