import { SearchClient, SearchIndex } from 'algoliasearch';
import { SearchPlugin } from '../interfaces';
import { AlgoliaPluginOptions } from './types';
export declare class AlgoliaPlugin implements SearchPlugin {
    apiKey: string;
    appId: string;
    indexName: string;
    client: SearchClient;
    index: SearchIndex;
    customConfig?: Record<string, unknown>;
    constructor(opts: AlgoliaPluginOptions);
    addRecords(records: any[]): Promise<void>;
    generateConfig(): Promise<string>;
    init(): Promise<void>;
}
