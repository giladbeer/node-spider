import * as crypto from 'crypto';

export const md5 = (source: string) => {
  return crypto.createHash('md5').update(source).digest('hex');
};
