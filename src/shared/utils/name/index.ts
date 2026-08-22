import { normalizeSpaces, toTitleCase } from '@shared/utils/text/index.js';

export const formatPersonName = (value: string): string => toTitleCase(normalizeSpaces(value));

export const abbreviateSurname = (value: string): string => {
  const parts = formatPersonName(value).split(' ');
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0)}.`;
};
