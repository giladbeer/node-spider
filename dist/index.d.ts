import { LogLevel } from './Logger';
export { loadConfig } from './configLoader';
import { SpiderOptions } from './Spider';
export { Spider, SpiderOptions, Selectors, SelectorSet } from './Spider';
export interface CrawlSiteOptions {
    configFilePath?: string;
    config?: Pick<SpiderOptions, 'allowedDomains' | 'maxConcurrency' | 'selectors' | 'startUrls' | 'userAgent' | 'ignoreUrls'>;
    searchEngineOpts?: SpiderOptions['searchEngineOpts'];
    logLevel?: LogLevel;
    diagnostics?: boolean;
    diagnosticsFilePath?: string;
    timeout?: number;
}
export declare const crawlSite: (options: CrawlSiteOptions) => Promise<void>;
