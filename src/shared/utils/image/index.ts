/**
 * Tipo real da imagem, lido dos bytes.
 *
 * O `mimetype` que o multer entrega vem do cabeçalho do próprio cliente e não prova nada: um
 * arquivo qualquer renomeado para `.jpg` chega anunciado como `image/jpeg`. Como a foto
 * depois é devolvida com um `Content-Type` que o navegador obedece, aceitar a palavra do
 * cliente seria deixá-lo escolher como o conteúdo dele é interpretado.
 *
 * Só três formatos, e é de propósito: JPEG, PNG e WebP cobrem o que uma câmera de celular
 * produz. SVG fica de fora porque é documento com script dentro, não imagem.
 */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

const EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const startsWith = (buffer: Buffer, bytes: number[], offset = 0): boolean =>
  bytes.every((byte, index) => buffer[offset + index] === byte);

export const sniffImageMime = (content: Buffer): ImageMimeType | null => {
  if (content.length < 12) return null;

  if (startsWith(content, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(content, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';

  // WebP é um contêiner RIFF: "RIFF" nos 4 primeiros bytes e "WEBP" a partir do oitavo.
  if (
    startsWith(content, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(content, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }

  return null;
};

export const extensionFor = (mimeType: ImageMimeType): string => EXTENSIONS[mimeType];

/** O caminho no storage é a fonte da verdade do tipo — foi ele que a gravação escolheu. */
export const mimeFromStoredPath = (storedPath: string): ImageMimeType | null => {
  const entry = Object.entries(EXTENSIONS).find(([, extension]) => storedPath.endsWith(extension));
  return entry ? (entry[0] as ImageMimeType) : null;
};
