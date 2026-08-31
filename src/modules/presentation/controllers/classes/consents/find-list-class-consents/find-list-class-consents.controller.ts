import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  classConsentParamsSchema,
  findListClassConsentsSchema,
} from '../../../../../application/dtos/classes/consents/find-list-class-consents/input.js';
import {
  ClassConsentMapper,
  StudentConsentStatusOutput,
} from '../../../../../application/mappers/classes/consents/class-consent-mapper.js';
import { FindListClassConsentsUseCase } from '../../../../../application/use-cases/classes/consents/find-list-class-consents/find-list-class-consents.usecase.js';

export class FindListClassConsentsController {
  constructor(private readonly useCase: FindListClassConsentsUseCase) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<StudentConsentStatusOutput>>> {
    const { actor } = request.context;
    const { classId } = classConsentParamsSchema.parse(request.params);
    const query = findListClassConsentsSchema.parse(request.query);

    const viewerId = authz.scopesOf(actor, Feature.ConsentView).includes('ESCOLA')
      ? null
      : actor.id;

    const { items, pagination } = await this.useCase.execute({
      classId,
      page: query.page,
      limit: query.limit,
      actorId: actor.id,
      viewerId,
    });

    return {
      statusCode: 200,
      body: paginated(items.map(ClassConsentMapper.toOutput), pagination),
    };
  }
}
