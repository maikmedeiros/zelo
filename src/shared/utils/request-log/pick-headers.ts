import { IncomingHttpHeaders } from 'node:http';

const ALLOWED = [
  'accept',
  'accept-language',
  'content-length',
  'content-type',
  'host',
  'origin',
  'referer',
  'user-agent',
  'x-forwarded-for',
  'x-request-id',
] as const;

export const pickHeaders = (headers: IncomingHttpHeaders): Record<string, unknown> =>
  Object.fromEntries(
    ALLOWED.filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]),
  );
