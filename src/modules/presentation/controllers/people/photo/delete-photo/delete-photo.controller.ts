import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { personPhotoParamsSchema } from '../../../../../application/dtos/people/photo/find-photo/input.js';
import { DeletePhotoUseCase } from '../../../../../application/use-cases/people/photo/delete-photo/delete-photo.usecase.js';

export class DeletePhotoController {
  constructor(private readonly useCase: DeletePhotoUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { personId } = personPhotoParamsSchema.parse(request.params);

    const ownOnly = !authz.scopesOf(actor, Feature.PhotoUpdate).includes('ESCOLA');

    await this.useCase.execute(personId, actor.id, ownOnly);

    return { statusCode: 204 };
  }
}
