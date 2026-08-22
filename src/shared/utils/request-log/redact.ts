const MASK = '[REDACTED]';

// Comparação normalizada: caixa baixa e sem `-`/`_`, para `x-auth-token` e `novaSenha`
// caírem na mesma regra que `token` e `senha`.
const normalize = (key: string): string => key.toLowerCase().replace(/[-_]/g, '');

const EXACT_KEYS = new Set(
  [
    'authorization',
    'cookie',
    'setcookie',
    'xapikey',
    'refreshtoken',
    'accesstoken',
    'cpf',
    'rg',
  ].map(normalize),
);

const RADICALS = ['password', 'senha', 'token', 'secret', 'apikey', 'passwd', 'credential'];

const isSensitive = (key: string): boolean => {
  const normalized = normalize(key);
  return EXACT_KEYS.has(normalized) || RADICALS.some((radical) => normalized.includes(radical));
};

/** Mascara por NOME de chave, recursivamente. Não inspeciona valor. */
export const redact = (value: unknown, seen: WeakSet<object> = new WeakSet()): unknown => {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `[Buffer ${value.byteLength}B]`;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      isSensitive(key) ? MASK : redact(val, seen),
    ]),
  );
};
