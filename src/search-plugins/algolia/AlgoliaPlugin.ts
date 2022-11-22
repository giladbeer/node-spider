import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch';
import { SearchPlugin } from '../interfaces';
import { buildAlgoliaConfig, parseAlgoliaConfig } from './algoliaConfigHelper';
import { AlgoliaPluginOptions } from './types';
import * as fs from 'fs';

export class AlgoliaPlugin implements SearchPlugin {
  apiKey: string;
  appId: string;
  indexName: string;
  client: SearchClient;
  index: SearchIndex;
  customConfig?: Record<string, unknown>;

  constructor(opts: AlgoliaPluginOptions) {
    this.apiKey = opts.apiKey;
    this.appId = opts.appId;
    this.indexName = opts.indexName;
    this.client = algoliasearch(opts.appId, opts.apiKey);
    this.index = this.client.initIndex(opts.indexName);
    if (opts.customConfig) {
      this.customConfig =
        typeof opts.customConfig === 'string'
          ? parseAlgoliaConfig(opts.customConfig)
          : opts.customConfig;
    }
  }

  async addRecords(records: any[]) {
    await this.client.multipleBatch(
      records.map((record) => ({
        action: 'addObject',
        indexName: this.indexName,
        body: record
      }))
    );
  }

  async generateConfig() {
    const config = buildAlgoliaConfig();
    await this.index.setSettings(this.customConfig || config); // if there is custom config, overwrite the default
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
}
