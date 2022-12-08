import { ScrapedRecord } from '../../types';

export const transformRecord = (record: ScrapedRecord) => {
  const { uniqueId, ...rest } = record;
  return {
    ...rest,
    objectID: uniqueId,
    originType: 'siteSearchRecord'
  };
};
