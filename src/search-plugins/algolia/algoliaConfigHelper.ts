import * as fs from 'fs';

export const buildAlgoliaConfig = () => {
  const config = {
    attributesToRetrieve: ['l0', 'l1', 'l2', 'l3', 'l4', 'url', 'content'],
    searchableAttributes: ['l0', 'l1', 'l2', 'l3', 'l4', 'url', 'content'],
    ranking: [
      'words',
      'filters',
      'typo',
      'attribute',
      'proximity',
      'exact',
      'custom'
    ],
    minWordSizefor1Typo: 3,
    minWordSizefor2Typos: 7,
    hitsPerPage: 20,
    maxValuesPerFacet: 100,
    minProximity: 1
    // TODO - add properties
    // customRanking: [
    //   'desc(weight.page_rank)',
    //   'desc(weight.level)',
    //   'asc(weight.position)'
    // ]
  };
  return config;
};

export const parseAlgoliaConfig = (filePath: string) => {
  const configFile = fs.readFileSync(filePath);
  const config = JSON.parse(configFile.toString());
  return config;
};
