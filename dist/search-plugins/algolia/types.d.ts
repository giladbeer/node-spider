export interface AlgoliaPluginOptions {
    apiKey: string;
    appId: string;
    indexName: string;
    customConfig?: Record<string, unknown> | string;
}
