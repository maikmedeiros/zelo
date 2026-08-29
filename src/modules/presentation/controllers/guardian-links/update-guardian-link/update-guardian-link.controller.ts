import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateGuardianLinkInput,
  updateGuardianLinkParamsSchema,
} from '../../../../application/dtos/guardian-links/update-guardian-link/input.js';
import { UpdateGuardianLinkOutput } from '../../../../application/dtos/guardian-links/update-guardian-link/output.js';
import { GuardianLinkMapper } from '../../../../application/mappers/guardian-links/guardian-link-mapper.js';
import { UpdateGuardianLinkUseCase } from '../../../../application/use-cases/guardian-links/update-guardian-link/update-guardian-link.usecase.js';

export class UpdateGuardianLinkController {
  constructor(private readonly useCase: UpdateGuardianLinkUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateGuardianLinkOutput>> {
    const { actor } = request.context;
    const { linkId } = updateGuardianLinkParamsSchema.parse(request.params);
    const input = request.body as UpdateGuardianLinkInput;

    const link = await this.useCase.execute(linkId, input, actor.id);

    return { statusCode: 200, body: GuardianLinkMapper.toOutput(link) };
  }
}
