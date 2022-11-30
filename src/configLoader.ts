import * as fs from 'fs';
import { CrawlSiteOptionsCrawlerConfig } from './types';

export const loadConfig = (filePath: string) => {
  const configFile = fs.readFileSync(filePath);
  const jsonConfig = JSON.parse(configFile.toString());
  return jsonConfig as CrawlSiteOptionsCrawlerConfig;
};
