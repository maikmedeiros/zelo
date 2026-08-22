/**
 * TODO(html): se algum dia a postagem passar a aceitar rich text, troque o escape por
 * sanitização com allowlist de tags aqui — este é o único ponto de entrada.
 */
const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c]!);

export const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, '');
