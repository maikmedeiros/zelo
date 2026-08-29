import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateTeacherInput } from '../../../../application/dtos/teachers/create-teacher/input.js';
import { CreateTeacherOutput } from '../../../../application/dtos/teachers/create-teacher/output.js';
import { TeacherMapper } from '../../../../application/mappers/teachers/teacher-mapper.js';
import { CreateTeacherUseCase } from '../../../../application/use-cases/teachers/create-teacher/create-teacher.usecase.js';

export class CreateTeacherController {
  constructor(private readonly useCase: CreateTeacherUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateTeacherOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateTeacherInput;

    const teacher = await this.useCase.execute({
      personId: input.personId,
      registration: input.registration,
      education: input.education,
      actorId: actor.id,
    });

    return { statusCode: 201, body: TeacherMapper.toOutput(teacher) };
  }
}
