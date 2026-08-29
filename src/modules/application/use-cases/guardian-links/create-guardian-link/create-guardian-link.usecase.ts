import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { GuardianLink } from '../../../../domain/entities/guardian-link.js';
import {
  CreateGuardianLinkData,
  IGuardianLinkRepository,
} from '../../../../domain/repositories/i-guardian-link-repository.js';
import { IGuardianRepository } from '../../../../domain/repositories/i-guardian-repository.js';
import { IStudentRepository } from '../../../../domain/repositories/i-student-repository.js';

export interface CreateGuardianLinkInputData extends CreateGuardianLinkData {
  actorId: string;
}

export class CreateGuardianLinkUseCase {
  constructor(
    private readonly linkRepo: IGuardianLinkRepository,
    private readonly guardianRepo: IGuardianRepository,
    private readonly studentRepo: IStudentRepository,
  ) {}

  async execute(data: CreateGuardianLinkInputData): Promise<GuardianLink> {
    // As conferências antes do INSERT deixam o recordset vazio com uma causa só: o vínculo
    // vigente duplicado.
    const guardian = await this.guardianRepo.findById(data.guardianId, data.actorId, null);
    if (!guardian) throw new NotFoundError({ message: 'Responsável não encontrado' });

    const student = await this.studentRepo.findById(data.studentId, data.actorId, null);
    if (!student) throw new NotFoundError({ message: 'Aluno não encontrado' });

    const linkId = await this.linkRepo.create(data);
    if (!linkId) {
      throw new ConflictError({
        message: 'Já existe vínculo vigente entre este responsável e este aluno',
        cause: { guardianId: data.guardianId, studentId: data.studentId },
      });
    }

    const link = await this.linkRepo.findById(linkId, data.actorId, null);
    if (!link) throw new InternalServerError({ message: 'Vínculo gravado mas não relido' });

    return link;
  }
}
