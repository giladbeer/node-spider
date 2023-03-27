import { AlgoliaPluginOptions } from './algolia/types';

export interface SearchPlugin {
  addRecords: (records: any[]) => Promise<void>;
  generateConfig?: () => Promise<any>;
  init?: () => Promise<void>;
  finish: () => Promise<void>;
}

export interface GeneralPluginSettings {
  /** should index records that did not originate in a site crawl be kept after re-populating the index
   * with new site crawl records. Useful if the site search index includes entries from sources other than the crawler */
  keepNonCrawlerRecords?: boolean;
}

export type SearchEngineName = 'algolia' | 'elasticsearch' | 'test';

export interface SearchPluginOptions {
  generalSettings: GeneralPluginSettings;

  /** specifies the search engine */
  engine: SearchEngineName;
  /** algolia specific optins */
  algolia?: AlgoliaPluginOptions;
  /** elasticsearch specific optins */
  elasticsearch?: { foo: string }; // TODO - add real options type
}
