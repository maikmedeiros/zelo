import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { personPhotoParamsSchema } from '../../../../../application/dtos/people/photo/find-photo/input.js';
import { FindPhotoUseCase } from '../../../../../application/use-cases/people/photo/find-photo/find-photo.usecase.js';

export class FindPhotoController {
  constructor(private readonly useCase: FindPhotoUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Buffer>> {
    const { actor } = request.context;
    const { personId } = personPhotoParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.PhotoView).includes('ESCOLA') ? null : actor.id;

    const { content, mimeType } = await this.useCase.execute(personId, actor.id, viewerId);

    return {
      statusCode: 200,
      body: content,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(content.byteLength),
        // O nome do arquivo carrega o hash do conteúdo, então a imagem de uma chave nunca
        // muda — mas a chave da pessoa sim. `private` mantém a foto fora de cache
        // compartilhado: é dado pessoal atrás de sessão, não asset público.
        'Cache-Control': 'private, max-age=300',
      },
    };
  }
}
