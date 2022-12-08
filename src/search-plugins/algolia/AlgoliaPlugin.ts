import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import { GeneralPluginSettings, SearchPlugin } from '../interfaces';
import { buildAlgoliaConfig, parseAlgoliaConfig } from './algoliaConfigHelper';
import { AlgoliaPluginOptions } from './types';
import * as fs from 'fs';
import { ScrapedRecord } from '../../types';
import { transformRecord } from './transform';

export class AlgoliaPlugin implements SearchPlugin {
  apiKey: string;
  appId: string;
  indexName: string;
  client: SearchClient;
  originalIndex: SearchIndex;
  newIndex: SearchIndex;
  customConfig?: Record<string, unknown>;
  keepNonCrawlerRecords?: boolean;

  constructor(opts: Partial<AlgoliaPluginOptions & GeneralPluginSettings>) {
    if (!opts.apiKey || !opts.appId || !opts.indexName) {
      throw new Error(
        'one or more of the following options is missing from the Algolia plugin initializer: apiKey, appId, indexName'
      );
    }
    this.apiKey = opts.apiKey;
    this.appId = opts.appId;
    this.indexName = opts.indexName;
    this.client = algoliasearch(opts.appId, opts.apiKey);
    this.originalIndex = this.client.initIndex(opts.indexName);
    this.newIndex = this.client.initIndex(`${opts.indexName}_new`);
    if (opts.customConfig) {
      this.customConfig =
        typeof opts.customConfig === 'string'
          ? parseAlgoliaConfig(opts.customConfig)
          : opts.customConfig;
    }
    if (opts.keepNonCrawlerRecords) {
      this.keepNonCrawlerRecords = opts.keepNonCrawlerRecords;
    }
  }

  async addRecords(records: ScrapedRecord[]) {
    await this.client.multipleBatch(
      records.map((record) => ({
        action: 'updateObject',
        indexName: `${this.indexName}_new`,
        body: transformRecord(record)
      }))
    );
  }

  async generateConfig() {
    const config = buildAlgoliaConfig();
    await this.newIndex.setSettings(this.customConfig || config); // if there is custom config, overwrite the default
    const NATIVE_CONFIG_FILE_PATH = 'node_spider_algolia_config.json';
    const CUSTOM_CONFIG_FILE_PATH = 'node_spider_algolia_config_custom.json';
    fs.writeFileSync(
      NATIVE_CONFIG_FILE_PATH,
      JSON.stringify(config, undefined, 4)
    );
    if (this.customConfig) {
      fs.writeFileSync(
        CUSTOM_CONFIG_FILE_PATH,
        JSON.stringify(config, undefined, 4)
      );
    }
    return NATIVE_CONFIG_FILE_PATH;
  }

  async init() {
    await this.generateConfig();
  }

  async finish() {
    // if keepNonCrawlerRecords has been set to true, find all records in the original index that were not indexed by the spider,
    // and add them to the new index
    if (this.keepNonCrawlerRecords) {
      const oldIndexExists = await this.originalIndex.exists();
      if (oldIndexExists) {
        const hits: any[] = [];
        await this.originalIndex.browseObjects<any>({
          batch: (batch) => {
            batch.forEach((item) => {
              if (item.originType !== 'siteSearchRecord') {
                hits.push(item);
              }
            });
          }
        });
        await this.client.multipleBatch(
          hits.map((hit) => ({
            action: 'updateObject',
            indexName: `${this.indexName}_new`,
            body: hit
          }))
        );
      }
    }
    await this.client.moveIndex(`${this.indexName}_new`, this.indexName);
  }
}
