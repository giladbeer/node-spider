import { formatDuration } from './dateTime';

describe('utils/dateTime', () => {
  test('utils/dateTime/formatDuration', () => {
    const d1 = (2 * 60 * 60 + 43 * 60 + 52) * 1000 + 812;
    const d2 = (0 * 60 * 60 + 17 * 60 + 20) * 1000 + 400;
    const d3 = (1 * 60 * 60 + 5 * 60 + 8) * 1000 + 3;
    expect(formatDuration(d1)).toEqual('02:43:52');
    expect(formatDuration(d2)).toEqual('00:17:20');
    expect(formatDuration(d3)).toEqual('01:05:08');
  });
});
