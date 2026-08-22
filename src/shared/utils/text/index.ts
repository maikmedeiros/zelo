// Partículas que ficam em caixa baixa no meio do texto (nunca na primeira posição).
const LOWERCASE_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

export const toTitleCase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && LOWERCASE_PARTICLES.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');

export const normalizeSpaces = (value: string): string => value.trim().replace(/\s+/g, ' ');

/** Slug ASCII para nome de arquivo e chave de busca. */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
