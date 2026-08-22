import multer from 'multer';

export interface UploadOptions {
  maxFileSizeBytes: number;
}

/**
 * `memoryStorage`: o arquivo vai para o `IFileStorage` (que calcula o hash do conteúdo),
 * não para um diretório temporário que ninguém limpa.
 */
export const createUpload = ({ maxFileSizeBytes }: UploadOptions): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes },
  });
