const base = {
  rootDir: 'src',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};

module.exports = {
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['**/*.spec.ts'],
      testPathIgnorePatterns: ['\\.int\\.spec\\.ts$', '\\.e2e-spec\\.ts$'],
    },
    {
      ...base,
      displayName: 'integration',
      testMatch: ['**/*.int.spec.ts'],
    },
    {
      ...base,
      displayName: 'e2e',
      testMatch: ['**/*.e2e-spec.ts'],
    },
  ],
};
