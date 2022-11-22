import { Level } from '../types';

export function getContentMatchLevel(
  contentMatch: string,
  selectorMatchesByLevel: Partial<Record<Level, string[]>>
) {
  // console.log('getContentMatchLevel');
  // console.log(JSON.stringify({ selectorMatchesByLevel, contentMatch }));
  return Object.entries(selectorMatchesByLevel).find(([, matches]) => {
    return matches?.includes(contentMatch);
  })?.[0];
}
