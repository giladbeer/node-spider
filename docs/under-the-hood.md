# under the hood

## how the spider works

The spider uses puppeteer to visit the start URL (or start URLs) provided in the config file. It queues a puppeteer job for each start URL.
In that job, it will then:
- visit the URL in a Chrome headless browser
- scrape the rendered page to construct the search records (see next section)
- extract all links from the visited page, and queue the obtained URLs (excluding ones that have already been visited in this run) for further jobs
- the spider will stop once the queue is empty (meaning, all start URLs and pages that are reachable via links from the start URLs, have been visited)

## scraping and constructing an index record

### a record structure
```ts
{
  uniqueId: string; // an md5 hash of the page URL and the text match (while this combination is not unique across a page, only the last matched record will be indexed so it can still serve as a unique ID)
  url: string; // the URL of the page from which the record was scraped (in other words, the page where the content was found)
  content: string; // the record's content field - typically used for a search result's description
  title: string; // the record's title field
  hierarchy: Hierarchy; // the hierarchy field - see below for more details
  metadata: Metadata; // metadata field - for any additional custom data from the scraper
  weight: { // for ranking
    level: number;
    pageRank: number;
  }
}
```

#### hierarchy object structure
```ts
{
  l0: string; // matches to this field will have the greatest contribution to the record's custom ranking (weight.level property)
  l1: string;
  l2: string;
  l3: string;
  l4: string;
  content: string; // matches to this field will have the lowest contribution to the record's custom ranking (weight.level property)
},
```

### the page scraping process in details
Each scraping job executes in a puppeteer-cluster task that runs on a single page. That job consists of the following steps:
- find the user-provided scraper settings that should apply to the page's URL (based on the settings URL pattern)
- query the DOM for the selectors specified in the settings that were retrieved in the previous step
- iterate over the retrieved DOM elements in their order of appearance in the DOM, turning them into indexed records in the structure detailed above
- during the scraping of a page, maintain a hierarchy object and create the different records with the state of that hierarchy at the point of their creation

### the hierarchy object explained
The hierarchy lets you define up to 5 levels of content to be matched, in a descending level of importance (meaning, level 0 should match the most important content). A typical setting is for level 0 to match the page title.
As the scraper iterates over the matched DOM elements in their order of appearance in the DOM, for each matched element it determines its hierarchy level in the provided settings. It then updates the current hierarchy state so it stores the current matched content under the property `[<level>]`.
The hierarchy state will continue getting updated while the page is being scraped, just before each new record is being created (that record will always include the updated hierarchy state at the time).
The hierarchy state will get cleared when moving to scrape the next page.
The importance of the hierarchy will come into play when searching for results (after the scraped records have been indexed for search): for a given search text, records that match the text in higher hierarchy levels, will be deemed more relevant than records that match the text in lower hierarchy levels.
For example, if my settings included:
```json
"hierarchySelectors": {
  "l0": "title",
  "l1": "#content h1",
  "l2": "#content h2",
  "l3": "#content h3",
  "l4": "#content h4",
  "content": "#content p"
},
```

And a scraped page included the markup:
```html
<head>
  <title>Upcoming events</title>
</head>
<body>
  <!-- LIST OF EVENTS... -->
</body>
```

While another page included the markup:
```html
<head>
  <title>About us</title>
</head>
<body>
  <p>At coolsite.org we promote all sorts of events...</p>
</body>
```

Then searching for "events" against the indexed scraped records will prioritise the record created from the first page's title element over the record created from the second page's p element (they both include the word "events" but the title element gives the first record a higher rank due to it being a level 0 match as opposed to a content level match)