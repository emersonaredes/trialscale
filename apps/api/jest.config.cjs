/** Jest em 3 projects: unit (sem DB), integration e isolation (DB de teste).
 *  O banco trialscale_test é recriado do zero pelo global-setup a partir do
 *  schema.sql — a MESMA fonte da verdade do dev (zero drift). */
const base = {
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
}

module.exports = {
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
    },
    {
      ...base,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
      globalSetup: '<rootDir>/test/global-setup.cjs',
    },
    {
      ...base,
      displayName: 'isolation',
      testMatch: ['<rootDir>/test/isolation/**/*.test.ts'],
      globalSetup: '<rootDir>/test/global-setup.cjs',
    },
  ],
}
