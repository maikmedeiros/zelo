import security from 'eslint-plugin-security';
import tsParser from '@typescript-eslint/parser';

/**
 * Config ISOLADA de SAST — rodada por `npm run lint:security`, não pela config principal.
 * Manter separado é o que permite tratar finding de segurança como gate próprio (pre-push
 * e CI) sem poluir o lint do dia a dia.
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'uploads/**'] },
  security.configs.recommended,
  {
    files: ['**/*.{ts,js}'],
    // O plugin não traz parser de TS; sem isto todo arquivo `.ts` falha no parse e o gate
    // passa vazio — pior que falhar, porque parece verde.
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Falso-positivo alto em mappers (acesso por chave dinâmica é o trabalho deles).
      'security/detect-object-injection': 'off',
    },
  },
];
