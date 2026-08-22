import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, resolve, sep } from 'node:path';
import { slugify } from '@shared/utils/text/index.js';

export interface SaveFileParams {
  folder: string;
  originalName: string;
  content: Buffer;
  mimeType: string;
}

export interface StoredFile {
  storedPath: string;
  sizeBytes: number;
  mimeType: string;
  contentHash: string;
}

export interface IFileStorage {
  save(params: SaveFileParams): Promise<StoredFile>;
}

/**
 * TODO(cdn): trocar por um provider de CDN/S3 aqui — nenhum repositório conhece esta
 * classe, só a factory.
 */
export class LocalFileStorage implements IFileStorage {
  constructor(private readonly root: string) {}

  async save({ folder, originalName, content, mimeType }: SaveFileParams): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(content).digest('hex');

    const extension = extname(originalName).toLowerCase();
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
}

const sanitizeFolder = (folder: string): string =>
  folder
    .split(/[/\\]+/)
    .map((segment) => slugify(segment))
    .filter((segment) => segment.length > 0)
    .join(posix.sep);

export const buildFileUrl = (baseUrl: string, storedPath: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${join('midia', storedPath).split(sep).join(posix.sep)}`;
