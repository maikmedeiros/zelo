import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeTeacherLinkInput } from '../../../../application/dtos/teacher-links/revoke-teacher-link/input.js';
import { RevokeTeacherLinkUseCase } from '../../../../application/use-cases/teacher-links/revoke-teacher-link/revoke-teacher-link.usecase.js';

export class RevokeTeacherLinkController {
  constructor(private readonly useCase: RevokeTeacherLinkUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { linkId } = request.params as unknown as RevokeTeacherLinkInput;

    await this.useCase.execute(linkId, actor.id);

    return { statusCode: 204 };
  }
}
