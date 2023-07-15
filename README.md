# node-spider

[![Build Status](https://github.com/giladbeer/node-spider/actions/workflows/quality-checks.yml/badge.svg)](https://github.com/giladbeer/node-spider/actions/workflows/quality-checks.yml)
[![npm](https://img.shields.io/npm/v/node-spider)](https://www.npmjs.com/package/@giladbeer/node-spider)
[![Known Vulnerabilities](https://snyk.io/test/github/giladbeer/node-spider/badge.svg)](https://snyk.io/test/github/giladbeer/node-spider)
[![MIT License](https://img.shields.io/npm/l/node-spider.svg)](#license)


A Node.js web spider for site search. Inspired by the deprecated https://github.com/algolia/docsearch-scraper
NOTE: The project is in a very early stage.

## overview

node-spider lets you crawl your website, scrape content that matches html selectors you specified in a config file, then index them in a search engine (currently only supports Algolia) to serve your site search features.

Under the hood, the project uses [puppeteer-cluster](https://github.com/thomasdondorf/puppeteer-cluster), which in turn uses [puppeteer](https://github.com/puppeteer/puppeteer)

## getting started

### installation

npm
```sh
npm install --save puppeteer # the project uses puppeteer-cluster and puppeteer under the hood
npm install --save puppeteer-cluster # the project uses puppeteer-cluster and puppeteer under the hood
npm install --save @giladbeer/node-spider
```

yarn
```sh
yarn add puppeteer puppeteer-cluster @giladbeer/node-spider
```

### usage

```js
import { crawlSite } from '@giladbeer/node-spider';

const letsStartCrawling = async () => {
  await crawlSite({
      configFilePath: 'path/to/your/config.json',
      searchEngineOpts: {
        algolia: {
          apiKey: '<your algolia API key>',
          appId: '<your algolia app ID>',
          indexName: '<your algolia index name>'
        }
      },
      diagnostics: true,
      logLevel: 'debug',
      maxIndexedRecords: 300
    });
}

letsStartCrawling().then(() => {
  process.exit(0);
})
```

## API docs (WIP)

- [crawlSite](#crawlSite)

### crawlSite

instantiates a Spider object, initializing it based on your config file and settings, then invoking its `crawl` method.

#### crawlSite options:

| Property | Required | Type | Description |
| --- | --- | --- | --- |
| `configFilePath` | N | string | the path to your config json file |
| `config` | N | [CrawlSiteOptionsCrawlerConfig](#CrawlSiteOptionsCrawlerConfig) | alternatively to passing a config file path, can pass the config file's properties here |
| `searchEngineOpts` | N | SearchEngineOpts | search engine settings |
| `logLevel` | N | `"debug"` / `"warn"` / `"error"` | log level |
| `diagnostics` | N | boolean | whether or not to output diagnostics |
| `diagnosticsFilePath` | N | string | path to the file where diagnostics will be written to |
| `timeout` | N | number | timeout in ms |
| `maxIndexedRecords` | N | number | maximum number of records to index. If reached, the crawling jobs will terminate |

#### CrawlSiteOptionsCrawlerConfig
| Property | Required | Type | Description |
| --- | --- | --- | --- |
| `startUrls` | Y | string / string[] | list of urls that the crawler will start from |
| `scraperSettings` | Y | [ScraperSettings](#ScraperSettings) | html selectors for telling the crawler which content to scrape for indexing |
| `allowedDomains` | N | string / string[] | list of allowed domains. When not specified, defaults to the domains of your startUrls |
| `ignoreUrls` | N | string / string[] | list of url patterns to ignore |
| `maxConcurrency` | N | number | maximum concurrent puppeteer clusters to run |

#### ScraperSettings
all of the scraper settings groups (each group except the default ties to a specific URL pattern)
| Property | Required | Type | Description |
| --- | --- | --- | --- |
| `default` | Y | [ScraperPageSettings](#ScraperPageSettings) | default scraper page settings - will be applied when the scraped url doesn't match any other scraper page settings group |
| `[your scraper page-level settings group name]` | N | [ScraperPageSettings](#ScraperPageSettings) | page-level settings group. Can add as many as you want. Each group will be applied to a given url pattern. During crawling, the settings for each page will be chosen based on which group's  `urlPatten` field matches the page url. The default one will be chosen if no match was found |
| `shared` | Y | [ScraperPageSettings](#ScraperPageSettings) | shared scraper settings - settings defined here will be applied for all pages unless there is an overriding setting in the default or the specific settings group that is matches the current page |

#### ScraperPageSettings
A group of a scraper settings - mostly hierarchy and metadata selectors, grouped by a specific URL pattern
| Property | Required | Type | Description |
| --- | --- | --- | --- |
| `hierarchySelectors` | Y | [HierarchySelectors](#HierarchySelectors) | selectors hierarchy (see below) |
| `metadataSelectors` | Y | Record<string, string> | metadata selectors. Mapping from html selectors to custom additional fields in the index, e.g. can scrape meta tags of a certain content pattern and store under a custom field |
| `urlPattern` | Y | string | URL pattern. During crawling, the settings group for each page will be chosen based on which group's `urlPatten` field matches the page url. The default one will be chosen if no match was found |
| `pageRank` | N | number | custom ranking for the matched pages. Defaults to 0 |
| `respectRobotsMeta` | N | boolean | whether or not the crawler should respect `noindex` meta tag. Defaults to false |
| `excludeSelectors` | N | string[] | list of html selectors to exclude from being scraped |
| `userAgent` | N | string | custom user agent to set when running puppeteer |
| `headers` | N | Record<string, string> | request headers to include when crawling the site |
| `basicAuth` | N | { user: string; password: string } | basic auth credentials |



#### HierarchySelectors
hierarchy selectors. Essentially a mapping from html selectors to indexed hierarchy levels
| Property | Required | Type | Description |
| --- | --- | --- | --- |
| `l0` | N | string | HTML selectors for matching l0, e.g. "span[class='myclass'], .myclass2" |
| `l1` | N | string | HTML selectors for matching l1 |
| `l2` | N | string | HTML selectors for matching l2|
| `l3` | N | string | HTML selectors for matching l3 |
| `l4` | N | string | HTML selectors for matching l4 |
| `content` | N | string | HTML selectors for matching content |
