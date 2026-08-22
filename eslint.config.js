import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import security from 'eslint-plugin-security';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'uploads/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{ts,js}'],
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: { prettier: prettierPlugin, security },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  {
    files: ['db/mongo-init/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        db: 'readonly',
        print: 'readonly',
        printjson: 'readonly',
        ObjectId: 'readonly',
        ISODate: 'readonly',
        UUID: 'readonly',
        quit: 'readonly',
        sleep: 'readonly',
        rs: 'readonly',
        sh: 'readonly',
      },
    },
  },
);
