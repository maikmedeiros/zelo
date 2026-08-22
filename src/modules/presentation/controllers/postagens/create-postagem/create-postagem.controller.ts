import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreatePostagemInputDTO } from '../../../../application/dtos/postagens/create-postagem/input.js';
import { CreatePostagemResult } from '../../../../application/dtos/postagens/create-postagem/output.js';
import {
  ArquivoRecebido,
  CreatePostagemUseCase,
} from '../../../../application/use-cases/postagens/create-postagem/create-postagem.usecase.js';

export class CreatePostagemController implements IController<IHttpRequest, CreatePostagemResult> {
  constructor(private readonly useCase: CreatePostagemUseCase) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse<CreatePostagemResult>> {
    // O body já foi validado e reatribuído pelo validator.
    const dto = httpRequest.body as CreatePostagemInputDTO;

    const body = await this.useCase.execute(
      dto,
      toArquivos(httpRequest.files),
      // Autoria grava o `handle` (identificador estável), NUNCA o `name` (exibição).
      httpRequest.context.actor.handle,
    );

    return { statusCode: 201, body };
  }
}

// `upload.array()` popula `req.files` como array; a forma de objeto vem de `upload.fields()`.
const toArquivos = (files: IHttpRequest['files']): ArquivoRecebido[] => {
  if (!files) return [];
  const list = Array.isArray(files) ? files : Object.values(files).flat();

  return list.map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    content: file.buffer,
  }));
};
