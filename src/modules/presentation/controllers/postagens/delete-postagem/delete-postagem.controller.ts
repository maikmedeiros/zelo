import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { ForbiddenError } from '@shared/errors/index.js';
import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeletePostagemUseCase } from '../../../../application/use-cases/postagens/delete-postagem/delete-postagem.usecase.js';

type Params = { postagemId: string };

export class DeletePostagemController implements IController<IHttpRequest<Params>, undefined> {
  constructor(private readonly useCase: DeletePostagemUseCase) {}

  async handle(httpRequest: IHttpRequest<Params>): Promise<IHttpResponse<undefined>> {
    const { actor } = httpRequest.context;
    const { postagemId } = httpRequest.params;

    await this.useCase.execute(postagemId, actor.handle, (ownerHandle) => {
      if (!authz.can(actor, Feature.PostagemDelete, { ownerHandle })) {
        throw new ForbiddenError({
          message: `Sem permissão para excluir a postagem ${postagemId}`,
        });
      }
    });

    return { statusCode: 204 };
  }
}
