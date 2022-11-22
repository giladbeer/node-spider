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

export type Level = keyof Hierarchy;

export interface SelectorSet {
  hierarchy: Hierarchy;
  urlPattern?: string;
}

export interface Selectors {
  default: Omit<SelectorSet, 'urlPattern'>;
  [name: string]: SelectorSet;
}

export interface ScrapedRecord {
  url: string;
  content: string;
  hierarchy: {
    l0?: string;
    l1?: string;
    l2?: string;
    l3?: string;
    l4?: string;
    content: string;
  };
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
  maxIndexedRecords?: number;
}
