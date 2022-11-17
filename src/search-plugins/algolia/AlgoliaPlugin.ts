import algoliasearch, { SearchClient } from 'algoliasearch';
import { SearchPlugin } from '../interfaces';
import { AlgoliaPluginOptions } from './types';

export class AlgoliaPlugin implements SearchPlugin {
  apiKey: string;
  appId: string;
  indexName: string;
  client: SearchClient;

  constructor(opts: AlgoliaPluginOptions) {
    this.apiKey = opts.apiKey;
    this.appId = opts.appId;
    this.indexName = opts.indexName;
    this.client = algoliasearch(opts.appId, opts.apiKey);
    this.client.initIndex(opts.indexName);
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
}
