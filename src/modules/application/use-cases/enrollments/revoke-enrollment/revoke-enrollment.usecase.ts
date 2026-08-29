import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IEnrollmentRepository } from '../../../../domain/repositories/i-enrollment-repository.js';

export class RevokeEnrollmentUseCase {
  constructor(private readonly enrollmentRepo: IEnrollmentRepository) {}

  async execute(enrollmentId: string, actorId: string): Promise<void> {
    const enrollment = await this.enrollmentRepo.findById(enrollmentId, actorId, null);
    if (!enrollment) throw new NotFoundError({ message: 'Matrícula não encontrada' });

    // Encerrar, não apagar: a matrícula passada é o que explica por que aquela criança
    // aparece nas postagens do ano anterior. Por isso a capability é REVOKE, e não DELETE.
    const encerrada = await this.enrollmentRepo.revoke(enrollmentId, null);
    if (!encerrada) {
      throw new ConflictError({
        message: 'Matrícula já encerrada',
        cause: { endDate: enrollment.endDate },
      });
    }
  }
}
