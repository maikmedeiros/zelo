import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateEnrollmentInput } from '../../../../application/dtos/enrollments/create-enrollment/input.js';
import { CreateEnrollmentOutput } from '../../../../application/dtos/enrollments/create-enrollment/output.js';
import { EnrollmentMapper } from '../../../../application/mappers/enrollments/enrollment-mapper.js';
import { CreateEnrollmentUseCase } from '../../../../application/use-cases/enrollments/create-enrollment/create-enrollment.usecase.js';

export class CreateEnrollmentController {
  constructor(private readonly useCase: CreateEnrollmentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateEnrollmentOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateEnrollmentInput;

    const enrollment = await this.useCase.execute({
      studentId: input.studentId,
      classId: input.classId,
      startDate: input.startDate ?? null,
      actorId: actor.id,
    });

    return { statusCode: 201, body: EnrollmentMapper.toOutput(enrollment) };
  }
}
