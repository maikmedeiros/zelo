import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { PostagemDetalheOutput } from '../../../../application/dtos/postagens/find-postagem-by-id/output.js';
import { FindPostagemByIdUseCase } from '../../../../application/use-cases/postagens/find-postagem-by-id/find-postagem-by-id.usecase.js';

type Params = { postagemId: string };

export class FindPostagemByIdController implements IController<
  IHttpRequest<Params>,
  PostagemDetalheOutput
> {
  constructor(private readonly useCase: FindPostagemByIdUseCase) {}

  async handle(httpRequest: IHttpRequest<Params>): Promise<IHttpResponse<PostagemDetalheOutput>> {
    const { actor } = httpRequest.context;
    const audienciaHandle = authz.hasAnyScope(actor, Feature.PostagemRead)
      ? undefined
      : actor.handle;

    const body = await this.useCase.execute(httpRequest.params.postagemId, audienciaHandle);

    return { statusCode: 200, body };
  }
}
