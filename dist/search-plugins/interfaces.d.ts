import { AlgoliaPluginOptions } from './algolia/types';
export interface SearchPlugin {
    addRecords: (records: any[]) => Promise<void>;
    generateConfig: () => Promise<any>;
    init?: () => Promise<void>;
}
export declare type SearchEngineName = 'algolia' | 'elasticsearch';
export interface SearchPluginOptions {
    algolia?: AlgoliaPluginOptions;
    elasticsearch?: {
        foo: string;
    };
}
