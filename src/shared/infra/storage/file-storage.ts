import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, posix, resolve, sep } from 'node:path';
import { slugify } from '@shared/utils/text/index.js';

export interface SaveFileParams {
  /** Subpasta lógica relativa à raiz do storage (ex.: `postagens/2026/08`). */
  folder: string;
  originalName: string;
  content: Buffer;
  mimeType: string;
}

export interface StoredFile {
  /** Caminho POSIX RELATIVO à raiz do storage. É isto que vai para o banco. */
  storedPath: string;
  sizeBytes: number;
  mimeType: string;
  contentHash: string;
}

export interface IFileStorage {
  save(params: SaveFileParams): Promise<StoredFile>;
}

/**
 * Implementação local. TODO(cdn): trocar por um provider de CDN/S3 aqui — nenhum
 * repositório conhece esta classe, só a factory.
 */
export class LocalFileStorage implements IFileStorage {
  constructor(private readonly root: string) {}

  async save({ folder, originalName, content, mimeType }: SaveFileParams): Promise<StoredFile> {
    const contentHash = createHash('sha256').update(content).digest('hex');

    // Nome físico com hash do CONTEÚDO: reupload gera nome diferente e invalida caches
    // de CDN/navegador sem precisar de query string de versão.
    const extension = extname(originalName).toLowerCase();
    const base =
      slugify(originalName.slice(0, originalName.length - extension.length)) || 'arquivo';
    const fileName = `${base}-${contentHash.slice(0, 12)}${extension}`;

    const storedPath = posix.join(sanitizeFolder(folder), fileName);
    const absolutePath = resolve(this.root, storedPath.split(posix.sep).join(sep));

    // Confina a escrita na raiz do storage: um `folder` malicioso não escapa.
    const rootPath = resolve(this.root);
    if (!absolutePath.startsWith(rootPath + sep)) {
      throw new Error(`Caminho de arquivo fora da raiz do storage: ${storedPath}`);
    }

    // O caminho é derivado do hash do conteúdo e confinado na raiz pela checagem acima.
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

/**
 * ÚNICO ponto que conhece o prefixo público. O banco guarda só o caminho relativo —
 * nunca o absoluto, nunca a URL — para que trocar de host/CDN não exija migração.
 */
export const buildFileUrl = (baseUrl: string, storedPath: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${join('midia', storedPath).split(sep).join(posix.sep)}`;
