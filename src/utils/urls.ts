export const withoutTrailingSlash = (s: string) => {
  const chars = s.split('');
  if (chars.at(-1) === '/') {
    return chars.slice(0, -1).join('');
  }
  return s;
};

export const urlToDomain = (urlString: string) => {
  try {
    if (!urlString.startsWith('http')) {
      urlString = 'https://' + urlString;
    }
    const url = new URL(urlString);
    return url.hostname.replace('www.', '');
  } catch (error) {
    return '';
  }
};
