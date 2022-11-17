export const uniq = (array: string[] = []) => {
  return [...new Set(array)];
};

export const withoutTrailingSlash = (s: string) => {
  const chars = s.split('');
  if (chars.at(-1) === '/') {
    return chars.slice(0, -1).join('');
  }
  return s;
};

export const urlToDomain = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.hostname.replace('www', '');
  } catch (error) {
    return '';
  }
};

export const setPropertyAtPath = (
  object: Record<string, unknown>,
  path: string[],
  value: unknown
) => {
  let p = object;
  for (let i = 0; i < path.length - 1; i++) {
    if (!p[path[i]] || typeof p[path[i]] !== 'object') {
      p[path[i]] = {};
    }
    p = p[path[i]] as any;
  }
  p[path.at(-1) as any] = value;
};

export const getPropertyAtPath = (
  object: Record<string, unknown>,
  path: string[]
) => {
  let p = object;
  for (let i = 0; i < path.length - 1; i++) {
    if (p[path[i]] && typeof p[path[i]] === 'object') {
      p = p[path[i]] as any;
    } else {
      return undefined;
    }
  }
  return p[path.at(-1) as any] || undefined;
};
