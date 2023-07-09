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

export const isNullable = <T>(x: T) => {
  return [undefined, null, ''].includes(x as any);
};

export const isOneOfType = <T>(
  x: T,
  y: T,
  type: 'object' | 'string' | 'boolean' | 'number'
) => {
  return typeof x === type || typeof y === type;
};

/**
 * looks up the values of attributes in a base object and a custom object of the same shape, falling back to the base if the custom doesn't
 * have a value for a attribute, and shallow merging attribute values that are of an object type
 * @param base - base object
 * @param custom - custom object
 * @param attributes - list of attributes
 * @returns values of the requested attributes
 * @example
 * interface X {
 *   a?: string;
 *   b?: boolean;
 *   c?: { x?: string; y?: string; z?: string }
 * }
 * const base: X = { a: '123', b: true, c: { x: 'x', y: 'y' } };
 * const custom: X = { a: '4', c: { z: 'z' } };
 * const { a, b, c } = getFromBaseAndCustom(base, custom, ['a', 'b', 'c']);
 * console.log(a); // '4'
 * console.log(b); // true
 * console.log(c); // { x: 'x', y: 'y', z: 'z' }
 */
export const getFromBaseAndCustom = <T, K extends keyof T>(
  base: T,
  custom: T,
  attributes: K[]
) => {
  const resultObject = {} as T;
  attributes.forEach((attribute) => {
    if (!(isNullable(base[attribute]) && isNullable(custom[attribute]))) {
      if (isOneOfType(base[attribute], custom[attribute], 'string')) {
        resultObject[attribute] = custom[attribute] || base[attribute];
      } else if (isOneOfType(base[attribute], custom[attribute], 'boolean')) {
        resultObject[attribute] = [true, false].includes(
          custom[attribute] as boolean
        )
          ? custom[attribute]
          : base[attribute];
      } else if (isOneOfType(base[attribute], custom[attribute], 'object')) {
        if (
          Array.isArray(base[attribute]) ||
          Array.isArray(custom[attribute])
        ) {
          resultObject[attribute] = [
            ...((base[attribute] || []) as any),
            ...((custom[attribute] || []) as any)
          ] as T[K];
        } else {
          resultObject[attribute] = {
            ...(base[attribute] as any),
            ...(custom[attribute] as any)
          } as T[K];
        }
      } else if (isOneOfType(base[attribute], custom[attribute], 'number')) {
        return typeof custom[attribute] === 'number'
          ? custom[attribute]
          : base[attribute];
      }
    }
  });
  return resultObject;
};

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
