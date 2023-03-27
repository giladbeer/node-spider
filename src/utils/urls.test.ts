import { urlToDomain, withoutTrailingSlash } from './urls';

describe('utils/urls', () => {
  test('utils/urls/withoutTrailingSlash - should return a url without its trailing slash', () => {
    expect(withoutTrailingSlash('www.site.com/')).toEqual('www.site.com');
    expect(withoutTrailingSlash('https://site.com/')).toEqual(
      'https://site.com'
    );
    expect(withoutTrailingSlash('https://site.com///')).toEqual(
      'https://site.com//'
    );
  });

  test('utils/urls/urlToDomain - should return a domain based on given url', () => {
    expect(urlToDomain('www.site.com')).toEqual('site.com');
    expect(urlToDomain('https://site.com')).toEqual('site.com');
    expect(urlToDomain('https://www.site.com')).toEqual('site.com');
    expect(urlToDomain('https://nested.subdomain.site.com')).toEqual(
      'nested.subdomain.site.com'
    );
  });
});
