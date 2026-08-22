import multer from 'multer';

export interface UploadOptions {
  maxFileSizeBytes: number;
}

export const createUpload = ({ maxFileSizeBytes }: UploadOptions): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes },
  });
