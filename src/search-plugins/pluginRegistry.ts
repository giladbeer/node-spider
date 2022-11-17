import { AlgoliaPlugin } from './algolia/AlgoliaPlugin';
import { SearchPluginOptions } from './interfaces';

export const getPlugin = (options?: SearchPluginOptions) => {
  if (options?.algolia) {
    const plugin = new AlgoliaPlugin(options.algolia);
    return plugin;
  }
  throw new Error('unknown plugin type');
};
