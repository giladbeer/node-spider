import * as fs from 'fs';

export const buildAlgoliaConfig = () => {
  const config = {
    attributesToRetrieve: [
      'l0',
      'l1',
      'l2',
      'l3',
      'l4',
      'url',
      'content',
      'title'
    ],
    searchableAttributes: [
      'l0',
      'l1',
      'l2',
      'l3',
      'l4',
      'url',
      'content',
      'title'
    ],
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
    minProximity: 1,
    customRanking: [
      'desc(weight.page_rank)',
      'desc(weight.level)'
      // TODO - think if we need this
      // 'asc(weight.position)'
    ]
  };
  return config;
};

export const parseAlgoliaConfig = (filePath: string) => {
  const configFile = fs.readFileSync(filePath);
  const config = JSON.parse(configFile.toString());
  return config;
};
