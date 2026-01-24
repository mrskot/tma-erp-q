import eslint from '@eslint/js';
import airbnbBase from 'eslint-config-airbnb-base';
import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.Config[]} */
export default [
  eslint.configs.recommended,
  ...airbnbBase,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        node: true,
        jest: true,
        es6: true,
      },
    },
    rules: {
      'no-console': 'off',
      'import/no-extraneous-dependencies': ['error', {
        devDependencies: ['**/*.test.js', '**/*.spec.js', '**/test/**'],
      }],
      'max-len': ['error', {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      }],
      'no-underscore-dangle': ['error', {
        allow: ['_id', '_count', '_sum', '_avg', '_min', '_max'],
      }],
      'camelcase': ['error', {
        properties: 'never',
        ignoreDestructuring: true,
      }],
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.json'],
        },
      },
    },
  },
];