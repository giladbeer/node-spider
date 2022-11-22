/* eslint-disable @typescript-eslint/no-var-requires */
const NodeSpider = require('../dist');
require('dotenv').config();

const run = async () => {
  await NodeSpider.crawlSite({
    configFilePath: 'config.json',
    searchEngineOpts: {
      algolia: {
        apiKey: process.env.ALGOLIA_ADMIN_API_KEY,
        appId: process.env.ALGOLIA_APP_ID,
        indexName: process.env.ALGOLIA_INDEX_NAME
      }
    },
    diagnostics: true,
    logLevel: 'debug',
    maxIndexedRecords: 300
  });
};

run()
  .then(() => {
    console.log('done');
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
