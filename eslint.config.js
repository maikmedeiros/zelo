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
    // Os `eslint-disable` de regra de segurança são consumidos pela config isolada de
    // SAST; aqui, com essas regras desligadas, todos apareceriam como "diretiva não
    // usada". Este lint não é o gate de segurança, então o relato fica com ele.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    // `security` entra registrado mas com as regras DESLIGADAS: o gate de SAST é a
    // config isolada (`eslint.config.security.js`). Sem registrar o plugin aqui, os
    // `eslint-disable` de regra de segurança viram erro "rule not found" neste lint.
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
);
