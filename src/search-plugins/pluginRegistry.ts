import { AlgoliaPlugin } from './algolia/AlgoliaPlugin';
import { DummyFsPlugin } from './dummy-fs-plugin/DummyFsPlugin';
import { SearchPlugin, SearchPluginOptions } from './interfaces';

export const getPlugin = (options?: SearchPluginOptions): SearchPlugin => {
  switch (options?.engine) {
    case 'algolia': {
      const plugin = new AlgoliaPlugin({
        ...options.algolia,
        ...options.generalSettings
      });
      return plugin;
    }
    case 'test': {
      return new DummyFsPlugin();
    }
    default: {
      throw new Error('unknown plugin type');
    }
  }
};
