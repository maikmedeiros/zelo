/** Os bytes da imagem. Sai como Buffer + Content-Type, não como JSON. */
export interface FindMediaOutput {
  content: Buffer;
  mimeType: string;
}
