/** '' → undefined, para o `.default()`/`.optional()` do Zod disparar. */
export const blankAsUndefined = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/** `?id=1&id=2` chega array, `?id=1` chega valor único — normaliza e descarta vazios. */
export const toList = (v: unknown): unknown => {
  if (v === undefined || v === null) return undefined;
  const list = (Array.isArray(v) ? v : [v]).filter(
    (item) => !(typeof item === 'string' && !item.trim()),
  );
  return list.length === 0 ? undefined : list;
};

/** `?turmaIds=1,2` — lista em UM parâmetro, formato que o front usa por padrão. */
export const toCsvList = (v: unknown): unknown => {
  if (typeof v !== 'string') return toList(v);
  const list = v
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return list.length === 0 ? undefined : list;
};
