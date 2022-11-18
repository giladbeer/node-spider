import { DiagnosticsService } from './DiagnosticsService';
import { Logger, LogLevel } from './Logger';
import { SearchPlugin, SearchPluginOptions } from './search-plugins/interfaces';
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
export declare class Spider {
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
    constructor(opts: SpiderOptions);
    registerSearchPlugin(options: SearchPluginOptions): void;
    crawl(): Promise<void>;
}
