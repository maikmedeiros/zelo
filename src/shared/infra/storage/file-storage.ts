import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, resolve, sep } from 'node:path';
import { slugify } from '@shared/utils/text/index.js';

export interface SaveFileParams {
  folder: string;
  originalName: string;
  content: Buffer;
  mimeType: string;
  /** Extensão a gravar, com o ponto. Omitida, usa a do nome original enviado pelo cliente. */
  extension?: string;
}

export interface StoredFile {
  storedPath: string;
  sizeBytes: number;
  mimeType: string;
  contentHash: string;
}

export interface IFileStorage {
  save(params: SaveFileParams): Promise<StoredFile>;
  /** `null` quando o arquivo não está lá — banco e disco podem divergir. */
  read(storedPath: string): Promise<Buffer | null>;
}

/**
 * TODO(cdn): trocar por um provider de CDN/S3 aqui — nenhum repositório conhece esta
 * classe, só a factory.
 */
export class LocalFileStorage implements IFileStorage {
  constructor(private readonly root: string) {}

  async save({
    folder,
    originalName,
    content,
    mimeType,
    extension: forcedExtension,
  }: SaveFileParams): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(content).digest('hex');

    const extension = forcedExtension ?? extname(originalName).toLowerCase();
    const base =
      slugify(originalName.slice(0, originalName.length - extension.length)) || 'arquivo';
    const fileName = `${base}-${contentHash.slice(0, 12)}${extension}`;

    const storedPath = posix.join(sanitizeFolder(folder), fileName);
    const absolutePath = resolve(this.root, storedPath.split(posix.sep).join(sep));

    const rootPath = resolve(this.root);
    if (!absolutePath.startsWith(rootPath + sep)) {
      throw new Error(`Caminho de arquivo fora da raiz do storage: ${storedPath}`);
    }

    /* eslint-disable security/detect-non-literal-fs-filename */
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
    /* eslint-enable security/detect-non-literal-fs-filename */

    return { storedPath, sizeBytes: content.byteLength, mimeType, contentHash };
  }

  async read(storedPath: string): Promise<Buffer | null> {
    const absolutePath = resolve(this.root, storedPath.split(posix.sep).join(sep));

    // A mesma trava do `save`: o caminho vem do banco, mas nada garante que ninguém escreveu
    // `../` ali. Confinar na raiz é barato e fecha o path traversal na leitura também.
    const rootPath = resolve(this.root);
    if (!absolutePath.startsWith(rootPath + sep)) return null;

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return await readFile(absolutePath);
    } catch {
      // Arquivo ausente não é falha da requisição: o banco aponta para um arquivo que o disco
      // não tem, e quem traduz isso em 404 é o use-case.
      return null;
    }
  }
}

const sanitizeFolder = (folder: string): string =>
  folder
    .split(/[/\\]+/)
    .map((segment) => slugify(segment))
    .filter((segment) => segment.length > 0)
    .join(posix.sep);

export const buildFileUrl = (baseUrl: string, storedPath: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${join('midia', storedPath).split(sep).join(posix.sep)}`;
