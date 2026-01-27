const base = {
  rootDir: 'src',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@grit/schema$': '<rootDir>/../../../packages/schema/src/index.ts',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(?:@grit/schema)/)'],

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
