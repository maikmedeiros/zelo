import { Media, MediaFile } from '../entities/media.js';

export interface CreateMediaData {
  postId: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IMediaRepository {
  /**
   * Sem paginação: uma postagem carrega punhado de fotos, não uma coleção. Paginar aqui
   * obrigaria o cliente a duas idas para montar uma galeria de três imagens.
   */
  listByPost(postId: string): Promise<Media[]>;

  /** `null` quando a mídia não existe ou não pertence a esta postagem. */
  findFile(mediaId: string, postId: string): Promise<MediaFile | null>;

  create(data: CreateMediaData): Promise<Media>;

  /** Remove a linha. O arquivo fica no disco — ver o comentário do use-case. */
  remove(mediaId: string, postId: string): Promise<boolean>;
}
