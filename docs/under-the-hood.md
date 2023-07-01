# under the hood

## how the spider works

The spider uses puppeteer to visit the start URL (or start URLs) provided in the config file. It queues a puppeteer job for each start URL.
In that job, it will then:
- visit the URL in a Chrome headless browser
- scrape the rendered page to construct the search records (see next section)
- extract all links from the visited page, and queue the obtained URLs (excluding ones that have already been visited in this run) for further jobs
- the spider will stop once the queue is empty (meaning, all start URLs and pages that are reachable via links from the start URLs, have been visited)

## scraping and constructing an index record

```ts
{
  uniqueId: string;
  url: string; // the URL of the page from which the record was scraped (in other words, the page where the content was found)
  content: string; // the 
  title: string;
  hierarchy: Hierarchy;
  metadata: Metadata;
  weight: {
    level: number;
    pageRank: number;
  }
}
```