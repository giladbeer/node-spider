export const uniq = (array: string[] = []) => {
  return [...new Set(array)];
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
