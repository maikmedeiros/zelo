import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { paginated, Paginated } from '@shared/presenters/index.js';
import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListPostagensQuerySchema } from '../../../../application/dtos/postagens/find-list-postagens/input.js';
import { PostagemItemOutput } from '../../../../application/dtos/postagens/find-list-postagens/output.js';
import { FindListPostagensUseCase } from '../../../../application/use-cases/postagens/find-list-postagens/find-list-postagens.usecase.js';

export class FindListPostagensController implements IController<
  IHttpRequest,
  Paginated<PostagemItemOutput>
> {
  constructor(private readonly useCase: FindListPostagensUseCase) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse<Paginated<PostagemItemOutput>>> {
    // Express 5: a query não foi reatribuída pelo validator — re-parseia com o MESMO schema.
    const dto = findListPostagensQuerySchema.parse(httpRequest.query ?? {});

    // Escopo resolvido AQUI (o enum não carrega escopo). Sem `:any`, o ator só enxerga as
    // turmas às quais está ligado — é o isolamento de audiência.
    const { actor } = httpRequest.context;
    const audienciaHandle = authz.hasAnyScope(actor, Feature.PostagemList)
      ? undefined
      : actor.handle;

    const { items, pagination } = await this.useCase.execute(dto, audienciaHandle);

    return { statusCode: 200, body: paginated(items, pagination) }; // envelope mora aqui
  }
}
