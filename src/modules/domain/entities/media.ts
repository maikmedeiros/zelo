export interface Media {
  id: string;
  postId: string;
  mimeType: string;
  sizeBytes: number;
  /** Posição na galeria da postagem. O primeiro upload é 1. */
  order: number;
  createdAt: Date;
}

/**
 * O bastante para servir os bytes: onde o arquivo está e o que ele é.
 *
 * Read model separado de `Media` porque a pergunta é outra — a galeria quer metadado, o
 * download quer o caminho no storage, que não deve vazar para o JSON da listagem.
 */
export interface MediaFile {
  key: string;
  mimeType: string;
}
