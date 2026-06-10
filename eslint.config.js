import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import storybook from 'eslint-plugin-storybook';

export default defineConfig(
  { ignores: ['node_modules/', 'dist/', 'storybook-static/', 'src/legacy/'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      prettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // Type-aware linting: lets the promise-safety rules below use the
        // TypeScript type-checker. projectService auto-discovers the nearest
        // tsconfig per file (tsconfig.app.json for src, tsconfig.node.json for
        // vite.config.ts). allowDefaultProject covers loose config/fixture
        // files that aren't part of any tsconfig program.
        projectService: {
          allowDefaultProject: ['.storybook/*.ts', '.storybook/*.tsx', 'playwright.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-children-prop': 'off',
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Type-aware promise-safety rules (require parserOptions.projectService).
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Build/config files run in Node, not the browser.
    files: ['*.{js,ts}', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    // Test and story files routinely use `any` for partial mocks, test doubles,
    // and story args where full typings add noise without real safety.
    files: ['**/*.{spec,test}.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
