import { ImageMimeType } from '@shared/utils/image/index.js';

/** A foto sai como bytes, não como JSON: o controller devolve `body` Buffer + Content-Type. */
export interface FindPhotoOutput {
  content: Buffer;
  mimeType: ImageMimeType;
}
