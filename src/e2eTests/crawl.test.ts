import { crawlSite } from '..';

describe('sample e2e tests', () => {
  test('sample e2e test 1', async () => {
    await crawlSite({
      configFilePath: './src/e2eTests/testconfig.json',
      searchEngineOpts: {
        engine: 'test',
        generalSettings: {}
      }
    });
    expect(1).toBe(1);
  });
});
