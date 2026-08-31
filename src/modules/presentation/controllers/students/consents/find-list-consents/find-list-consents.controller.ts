import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  consentParamsSchema,
  findListConsentsSchema,
} from '../../../../../application/dtos/students/consents/find-list-consents/input.js';
import {
  ConsentMapper,
  ConsentOutput,
} from '../../../../../application/mappers/students/consents/consent-mapper.js';
import { FindListConsentsUseCase } from '../../../../../application/use-cases/students/consents/find-list-consents/find-list-consents.usecase.js';

export class FindListConsentsController {
  constructor(private readonly useCase: FindListConsentsUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<ConsentOutput>>> {
    const { actor } = request.context;
    const { studentId } = consentParamsSchema.parse(request.params);

    // Re-parse: o Express 5 não deixa reatribuir `req.query`, então o valor coergido e
    // defaultado só existe aqui.
    const query = findListConsentsSchema.parse(request.query);

    const viewerId = authz.scopesOf(actor, Feature.ConsentView).includes('ESCOLA')
      ? null
      : actor.id;

    const { items, pagination } = await this.useCase.execute({
      studentId,
      page: query.page,
      limit: query.limit,
      type: query.type ?? null,
      current: query.current ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 200, body: paginated(items.map(ConsentMapper.toOutput), pagination) };
  }
}
