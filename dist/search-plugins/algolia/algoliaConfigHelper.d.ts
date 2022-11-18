export declare const buildAlgoliaConfig: () => {
    attributesToRetrieve: string[];
    searchableAttributes: string[];
    ranking: string[];
    minWordSizefor1Typo: number;
    minWordSizefor2Typos: number;
    hitsPerPage: number;
    maxValuesPerFacet: number;
    minProximity: number;
};
export declare const parseAlgoliaConfig: (filePath: string) => any;
