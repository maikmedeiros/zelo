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

    // Checagem por RECURSO: o guard recebe o dono já carregado pelo use-case, o que mantém
    // o `authz` fora da camada de aplicação.
    await this.useCase.execute(postagemId, actor.handle, (ownerHandle) => {
      if (!authz.can(actor, Feature.PostagemDelete, { ownerHandle })) {
        throw new ForbiddenError({
          message: `Sem permissão para excluir a postagem ${postagemId}`,
        });
      }
    });

    return { statusCode: 204 }; // 204 sem body — o adapter chama res.end()
  }
}
