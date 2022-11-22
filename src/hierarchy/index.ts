import { Level } from '../types';

export function getContentMatchLevel(
  contentMatch: string,
  selectorMatchesByLevel: Partial<Record<Level, string[]>>
) {
  // console.log('getContentMatchLevel');
  // console.log(JSON.stringify({ selectorMatchesByLevel, contentMatch }));
  return Object.entries(selectorMatchesByLevel).find(([, matches]) => {
    return matches?.includes(contentMatch);
  })?.[0] as Level;
}

export function getLevelWeight(level?: Level) {
  try {
    if (!level || level === 'content') {
      return 0;
    }
    const numericLevel = parseInt(level.split('l')[1]);
    return 100 - 10 * numericLevel;
  } catch (error) {
    return 0;
  }
}
