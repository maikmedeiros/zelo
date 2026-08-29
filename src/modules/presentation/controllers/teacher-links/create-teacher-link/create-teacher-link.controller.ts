import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateTeacherLinkInput } from '../../../../application/dtos/teacher-links/create-teacher-link/input.js';
import { CreateTeacherLinkOutput } from '../../../../application/dtos/teacher-links/create-teacher-link/output.js';
import { TeacherLinkMapper } from '../../../../application/mappers/teacher-links/teacher-link-mapper.js';
import { CreateTeacherLinkUseCase } from '../../../../application/use-cases/teacher-links/create-teacher-link/create-teacher-link.usecase.js';

export class CreateTeacherLinkController {
  constructor(private readonly useCase: CreateTeacherLinkUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateTeacherLinkOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateTeacherLinkInput;

    const link = await this.useCase.execute({
      teacherId: input.teacherId,
      classId: input.classId,
      role: input.role,
      startDate: input.startDate ?? null,
      actorId: actor.id,
    });

    return { statusCode: 201, body: TeacherLinkMapper.toOutput(link) };
  }
}
