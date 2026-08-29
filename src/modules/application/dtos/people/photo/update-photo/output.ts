export interface UpdatePhotoOutput {
  personId: string;
  /** Caminho relativo à raiz do storage. A imagem vem por `GET /people/:personId/photo`. */
  key: string;
  sizeBytes: number;
  mimeType: string;
}
