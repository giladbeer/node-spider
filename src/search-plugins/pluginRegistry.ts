import { AlgoliaPlugin } from './algolia/AlgoliaPlugin';
import { SearchPluginOptions } from './interfaces';

export const getPlugin = (options?: SearchPluginOptions) => {
  switch (options?.engine) {
    case 'algolia': {
      const plugin = new AlgoliaPlugin({
        ...options.algolia,
        ...options.generalSettings
      });
      return plugin;
    }
    default: {
      throw new Error('unknown plugin type');
    }
  }
};
