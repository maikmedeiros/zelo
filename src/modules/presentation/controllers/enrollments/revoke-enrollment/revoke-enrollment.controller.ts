import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeEnrollmentInput } from '../../../../application/dtos/enrollments/revoke-enrollment/input.js';
import { RevokeEnrollmentUseCase } from '../../../../application/use-cases/enrollments/revoke-enrollment/revoke-enrollment.usecase.js';

export class RevokeEnrollmentController {
  constructor(private readonly useCase: RevokeEnrollmentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { enrollmentId } = request.params as unknown as RevokeEnrollmentInput;

    await this.useCase.execute(enrollmentId, actor.id);

    return { statusCode: 204 };
  }
}
