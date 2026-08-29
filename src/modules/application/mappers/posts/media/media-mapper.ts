import { Media } from '../../../../domain/entities/media.js';

export interface MediaOutput {
  id: string;
  postId: string;
  mimeType: string;
  sizeBytes: number;
  order: number;
  createdAt: string;
}

export interface MediaPersistenceRow {
  ID: string;
  POSTAGEM_ID: string;
  MIME: string;
  BYTES: string;
  ORDEM: number;
  CRIADO_EM: Date;
}

export interface MediaFilePersistenceRow {
  CHAVE_ORIGINAL: string;
  MIME: string;
}

export class MediaMapper {
  static fromPersistence(row: MediaPersistenceRow): Media {
    return {
      id: row.ID,
      postId: row.POSTAGEM_ID,
      mimeType: row.MIME,
      // `bigint` chega como string: o driver não converte int8, porque ele não cabe em
      // `number` com segurança. Aqui cabe — imagem não passa de alguns megabytes.
      sizeBytes: Number(row.BYTES),
      order: row.ORDEM,
      createdAt: row.CRIADO_EM,
    };
  }

  static toOutput(media: Media): MediaOutput {
    return { ...media, createdAt: media.createdAt.toISOString() };
  }
}
