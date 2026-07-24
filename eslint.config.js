import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend (apps/api)
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      // Mecanismo de escopo (ADR 001): models só podem ser importados por
      // repositories/ e db/ — services/controllers nunca tocam Sequelize.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/models', '**/models/*'],
              message:
                'Models só podem ser importados por repositories/ e db/ (ADR 001 — escopo de tenant).',
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  // Exceções à regra de import de models (ADR 001)
  {
    files: [
      'apps/api/src/repositories/**/*.ts',
      'apps/api/src/db/**/*.ts',
      'apps/api/src/models/**/*.ts',
      'apps/api/test/**/*.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  // ADR 001: agregações/increment direto no model são bloqueadas em runtime
  // (registerTenancy); esta regra pega o uso no editor/CI antes do runtime.
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: ['apps/api/src/db/**', 'apps/api/test/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(sum|min|max|aggregate|increment|decrement|upsert)$/][callee.object.name=/^(?!Math$|Number$|Promise$|Object$|JSON$)[A-Z]/]",
          message:
            'Agregações/increment/upsert direto no model não passam pelos hooks de tenant (ADR 001). Use métodos do repository.',
        },
      ],
    },
  },

  // Arquivos CommonJS (configs de tooling e global-setup do Jest)
  {
    files: ['**/*.cjs'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },

  // Frontend (apps/web)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)
