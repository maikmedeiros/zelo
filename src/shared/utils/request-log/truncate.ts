export interface TruncatedValue {
  _truncated: true;
  _originalSize: number;
  preview: string;
}

/** Corpo acima do teto vira um resumo — o log não é lugar de guardar payload inteiro. */
export const truncate = (value: unknown, maxBytes: number): unknown => {
  if (value === undefined || value === null) return value;

  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (serialized === undefined) return value;

  const size = Buffer.byteLength(serialized, 'utf-8');
  if (size <= maxBytes) return value;

  const truncated: TruncatedValue = {
    _truncated: true,
    _originalSize: size,
    preview: Buffer.from(serialized, 'utf-8').subarray(0, maxBytes).toString('utf-8'),
  };

  return truncated;
};
