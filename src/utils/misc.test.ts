import { getFromBaseAndCustom } from './misc';

describe('utils/misc', () => {
  test('utils/misc/getFromBaseAndCustom', () => {
    interface X {
      a?: string;
      b?: boolean;
      c?: { x?: string; y?: string; z?: string };
    }
    const base: X = { a: '123', b: true, c: { x: 'x', y: 'y' } };
    const custom: X = { a: '4', c: { z: 'z' } };
    let values = getFromBaseAndCustom(base, custom, ['a', 'b', 'c']);
    expect(values).toEqual({
      a: '4',
      b: true,
      c: { x: 'x', y: 'y', z: 'z' }
    });
    custom.b = false;
    values = getFromBaseAndCustom(base, custom, ['a', 'b', 'c']);
    expect(values).toEqual({
      a: '4',
      b: false,
      c: { x: 'x', y: 'y', z: 'z' }
    });
  });
});
