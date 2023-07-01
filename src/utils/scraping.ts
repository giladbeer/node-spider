import { ScraperSettingsGroup, ScraperSettingsGroups } from '../types';
import { withoutTrailingSlash } from '../utils';
import { Level } from '../types';

/**
 * returns the scraper settings group that matches the current page's url, based on the group's urlPattern property
 * @param settings - all settings groups from the spider's config
 * @param currentUrl - url of the current page that is being crawled
 */
export function getSettingsGroupForUrl(
  settings: ScraperSettingsGroups,
  currentUrl: string
) {
  const settingsGroup =
    Object.values(settings).find((group) => {
      const pattern = group.urlPattern;
      if (!pattern) {
        return false;
      }
      if (withoutTrailingSlash(currentUrl).match(pattern)) {
        return true;
      }
    }) || settings.default;
  return settingsGroup;
}

// runs in browser context (puppeteer's page.evaluate()), so external functions are available using page.expose() and have to be awaited
// even if they are synchronous (e.g. uniq)
export async function getSelectorMatches({
  settingsGroup
}: {
  settingsGroup: ScraperSettingsGroup;
}) {
  const levels = Object.keys(settingsGroup.hierarchySelectors) as Level[];
  const selectors = (
    await (window as any).uniq(
      Object.values(settingsGroup.hierarchySelectors).join(',').split(',')
    )
  ).join(',');
  const selectorMatches = Array.from(document.querySelectorAll(selectors))
    .map((node) => node.textContent)
    .filter(Boolean);

  const selectorMatchesByLevel: Partial<Record<Level, string[]>> = {};
  levels.forEach((level) => {
    const selector = settingsGroup.hierarchySelectors[level];
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

// runs in browser context (puppeteer's page.evaluate()), so external functions are available using page.expose() and have to be awaited
// even if they are synchronous (e.g. uniq)
export async function getSelectorMetadata({
  settingsGroup
}: {
  settingsGroup: ScraperSettingsGroup;
}) {
  const metadataSelectors = Object.entries(
    settingsGroup.metadataSelectors || {}
  );
  const metadata: Record<string, any> = {};
  metadataSelectors.forEach(([propertyName, selector]) => {
    const matches = Array.from(document.querySelectorAll(selector))
      .map((node) => node.textContent || (node as HTMLMetaElement).content)
      .filter(Boolean);
    metadata[propertyName] = matches?.join();
  });
  return metadata;
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
