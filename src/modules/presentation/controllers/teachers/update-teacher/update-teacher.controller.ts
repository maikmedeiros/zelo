import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateTeacherInput,
  updateTeacherParamsSchema,
} from '../../../../application/dtos/teachers/update-teacher/input.js';
import { UpdateTeacherOutput } from '../../../../application/dtos/teachers/update-teacher/output.js';
import { TeacherMapper } from '../../../../application/mappers/teachers/teacher-mapper.js';
import { UpdateTeacherUseCase } from '../../../../application/use-cases/teachers/update-teacher/update-teacher.usecase.js';

export class UpdateTeacherController {
  constructor(private readonly useCase: UpdateTeacherUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateTeacherOutput>> {
    const { actor } = request.context;
    const { teacherId } = updateTeacherParamsSchema.parse(request.params);
    const input = request.body as UpdateTeacherInput;

    const teacher = await this.useCase.execute(teacherId, input, actor.id);

    return { statusCode: 200, body: TeacherMapper.toOutput(teacher) };
  }
}
