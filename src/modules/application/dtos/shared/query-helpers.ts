export const blankAsUndefined = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const toList = (v: unknown): unknown => {
  if (v === undefined || v === null) return undefined;
  const list = (Array.isArray(v) ? v : [v]).filter(
    (item) => !(typeof item === 'string' && !item.trim()),
  );
  return list.length === 0 ? undefined : list;
};

export const toCsvList = (v: unknown): unknown => {
  if (typeof v !== 'string') return toList(v);
  const list = v
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return list.length === 0 ? undefined : list;
};
