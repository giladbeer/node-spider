import { loadConfig } from './configLoader';
import { DiagnosticsService } from './DiagnosticsService';
import { LogLevel, Logger } from './Logger';

export { loadConfig } from './configLoader';
import { SpiderOptions } from './types';
import { Spider } from './Spider';
export { Spider } from './Spider';
export * from './types';

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
    | 'excludeSelectors'
  >;
  searchEngineOpts?: SpiderOptions['searchEngineOpts'];
  logLevel?: LogLevel;
  diagnostics?: boolean;
  diagnosticsFilePath?: string;
  timeout?: number;
  maxIndexedRecords?: number;
}

export const crawlSite = async (options: CrawlSiteOptions) => {
  const {
    config,
    configFilePath,
    searchEngineOpts = {},
    logLevel,
    diagnostics = false,
    diagnosticsFilePath,
    timeout = 0,
    maxIndexedRecords
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
        timeout,
        maxIndexedRecords
      });
      await spider.crawl();
    } else if (configFilePath) {
      const configFromFile = loadConfig(configFilePath);
      logger.debug(`loaded config from ${configFilePath}`, configFromFile);
      const spider = new Spider({
        ...configFromFile,
        searchEngineOpts,
        logger,
        diagnostics,
        diagnosticsService,
        diagnosticsFilePath,
        timeout,
        maxIndexedRecords
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
