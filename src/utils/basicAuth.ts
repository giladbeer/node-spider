export const getBasicAuthHeader = (user: string, password: string) => {
  return {
    Authorization: `Basic ${Buffer.from(
      `${user}:${password}`,
      'utf-8'
    ).toString('base64')}`
  };
};
