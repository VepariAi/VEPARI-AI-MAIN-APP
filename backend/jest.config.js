/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // Resolve workspace packages to their TS source in tests so the suite never
  // depends on a prior `dist/` build of the shared packages.
  moduleNameMapper: {
    '^@vepari/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@vepari/validation$': '<rootDir>/../../packages/validation/src/index.ts',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
