module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testRegex: '/src/.*\\.test?\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  preset: 'jest-puppeteer',
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: 'jest-environment-puppeteer'
};
