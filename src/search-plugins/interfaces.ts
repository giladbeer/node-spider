import { AlgoliaPluginOptions } from './algolia/types';

export interface SearchPlugin {
  addRecords: (records: any[]) => Promise<void>;
}

export type SearchEngineName = 'algolia' | 'elasticsearch';

export interface SearchPluginOptions {
  algolia?: AlgoliaPluginOptions;
  elasticsearch?: { foo: string }; // TODO - add real options type
}
