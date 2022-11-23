import { Selectors } from '../types';
import { withoutTrailingSlash, uniq } from '../utils';
import { Level, SelectorSet } from '../types';

export function findActiveSelectorSet(
  selectors: Selectors,
  currentUrl: string
) {
  const selectorSet =
    Object.values(selectors).find((set) => {
      const pattern = set.urlPattern;
      if (!pattern) {
        return false;
      }
      if (withoutTrailingSlash(currentUrl).match(pattern)) {
        return true;
      }
    }) || selectors.default;
  return selectorSet;
}

// runs in browser context (puppeteer's page.evaluate()), so external functions are available using page.expose() and have to be awaited
// even if they are synchronous (e.g. uniq)
export async function getSelectorMatches({
  selectorSet
}: {
  selectorSet: SelectorSet;
}) {
  const levels = Object.keys(selectorSet.hierarchy) as Level[];
  const selectors = (
    await uniq(Object.values(selectorSet.hierarchy).join(',').split(','))
  ).join(',');
  const selectorMatches = Array.from(document.querySelectorAll(selectors))
    .map((node) => node.textContent)
    .filter(Boolean);

  const selectorMatchesByLevel: Partial<Record<Level, string[]>> = {};
  levels.forEach((level) => {
    const selector = selectorSet.hierarchy[level];
    if (selector) {
      const levelContent = Array.from(document.querySelectorAll(selector))
        .map((node) => node.textContent)
        .filter(Boolean);
      selectorMatchesByLevel[level] = levelContent as string[];
    }
  });
  const title = selectorMatchesByLevel['l0']?.[0] || '';
  return {
    selectorMatches,
    selectorMatchesByLevel,
    title
  };
}

export async function removeExcludedElements({
  exclude
}: {
  exclude: string[];
}) {
  const elements = document.querySelectorAll(exclude.join());
  elements?.forEach((el) => {
    el.parentNode?.removeChild(el);
  });
}
