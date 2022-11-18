import { loadConfig } from './configLoader';
import { DiagnosticsService } from './DiagnosticsService';
import { LogLevel, Logger } from './Logger';

export { loadConfig } from './configLoader';
import { SpiderOptions, Spider } from './Spider';
export { Spider, SpiderOptions, Selectors, SelectorSet } from './Spider';

export interface CrawlSiteOptions {
  configFilePath?: string;
  config?: Pick<
    SpiderOptions,
    | 'allowedDomains'
    | 'maxConcurrency'
    | 'selectors'
    | 'startUrls'
    | 'userAgent'
    | 'ignoreUrls'
  >;
  searchEngineOpts?: SpiderOptions['searchEngineOpts'];
  logLevel?: LogLevel;
  diagnostics?: boolean;
  diagnosticsFilePath?: string;
  timeout?: number;
}

export const crawlSite = async (options: CrawlSiteOptions) => {
  const {
    config,
    configFilePath,
    searchEngineOpts = {},
    logLevel,
    diagnostics = false,
    diagnosticsFilePath,
    timeout = 0
  } = options;
  const logger = Logger.getInstance(logLevel);
  const diagnosticsService =
    diagnostics || diagnosticsFilePath
      ? DiagnosticsService.getInstance(diagnosticsFilePath)
      : undefined;

  try {
    if (config) {
      const spider = new Spider({
        ...config,
        searchEngineOpts,
        logger,
        diagnostics,
        diagnosticsService,
        diagnosticsFilePath,
        timeout
      });
      await spider.crawl();
    } else if (configFilePath) {
      const configFromFile = loadConfig(configFilePath);
      const spider = new Spider({
        ...configFromFile,
        searchEngineOpts,
        logger,
        diagnostics,
        diagnosticsService,
        diagnosticsFilePath,
        timeout
      });
      await spider.crawl();
    } else {
      throw new Error(
        'should be passed a config file path or an explicit config object'
      );
    }
  } catch (error) {
    logger.error('crawlSite:', error);
    throw error;
  }
};
