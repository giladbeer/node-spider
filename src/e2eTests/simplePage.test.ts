import * as fs from 'fs';
import { crawlSite } from '..';

const sleep = async (t: number) =>
  new Promise((resolve) => setTimeout(resolve, t));

describe('simple html page tests - no links', () => {
  test('output records should match snapshot', async () => {
    await crawlSite({
      configFilePath: './src/e2eTests/testconfig.json',
      searchEngineOpts: {
        engine: 'test',
        generalSettings: {}
      }
    });
    await sleep(3000);
    const output = fs.readFileSync('./dummy-fs-records.json');
    const snapshot = fs.readFileSync('./src/e2eTests/snapshots/snapshot-1');
    expect(output).toEqual(snapshot);
  });
});
