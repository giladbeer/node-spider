import { loadConfig } from './configLoader';
import { DiagnosticsService } from './DiagnosticsService';
import { Logger } from './Logger';

export { loadConfig } from './configLoader';
import { CrawlSiteOptionsCrawlerConfig, SpiderOptions } from './types';
import { Spider } from './Spider';
export { Spider } from './Spider';
export * from './types';

export interface CrawlSiteOptions {
  configFilePath?: string;
  config?: CrawlSiteOptionsCrawlerConfig;
  searchEngineOpts?: SpiderOptions['searchEngineOpts'];
  shouldExcludeResult?: (content: string) => boolean;
}
/**
 * instantiates a Spider object, initializing it based on your config file and settings, then invoking its `crawl` method.
 * @param options - crawler configuration and settings
 * @example
 * import { crawlSite } from '@giladbeer/node-spider';

// Using a config file
await crawlSite({
    configFilePath: 'path/to/your/config.json',
    searchEngineOpts: {
      algolia: {
        apiKey: '<your algolia API key>',
        appId: '<your algolia app ID>',
        indexName: '<your algolia index name>'
      }
    }
  });

// Using a config JS object
await crawlSite({
    config: {
      startUrls: ['https://www.google.com'],
      ignoreUrls: ['(.)*contact-us(.)*'],
      userAgent: 'Agent Smith',
      selectors: {
        default: {
          hierarchy: {
            l0: 'main h1' as any,
            l1: 'main h2' as any,
            l2: 'main h3' as any,
            l3: 'main h4' as any,
            l4: 'main h5' as any,
            content: 'main p' as any
          }
        }
      }
    }
  });
 */
export const crawlSite = async (options: CrawlSiteOptions) => {
  try {
    const config = options.configFilePath
      ? loadConfig(options.configFilePath)
      : options.config;
    if (!config) {
      throw new Error(
        'crawlSite should be passed a valid config file path or explicit config properties'
      );
    }
    const { logLevel, diagnostics, diagnosticsFilePath } = config;
    const logger = Logger.getInstance(logLevel);
    const diagnosticsService =
      diagnostics || diagnosticsFilePath
        ? DiagnosticsService.getInstance(diagnosticsFilePath)
        : undefined;
    const spider = new Spider({
      ...config,
      searchEngineOpts: options.searchEngineOpts,
      logger,
      diagnostics,
      diagnosticsService,
      diagnosticsFilePath,
      shouldExcludeResult: options.shouldExcludeResult
    });
    await spider.crawl();
  } catch (error) {
    console.error('crawlSite:', error);
    throw error;
  }
};
