import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Guardian } from '../../../../domain/entities/guardian.js';
import {
  CreateGuardianData,
  IGuardianRepository,
} from '../../../../domain/repositories/i-guardian-repository.js';
import { IPersonRepository } from '../../../../domain/repositories/i-person-repository.js';
import { assertPersonHasCpf } from '../../people/assert-person-has-cpf.js';

export class CreateGuardianUseCase {
  constructor(
    private readonly guardianRepo: IGuardianRepository,
    private readonly personRepo: IPersonRepository,
  ) {}

  async execute(data: CreateGuardianData): Promise<Guardian> {
    const person = await this.personRepo.findById(data.personId, data.actorId, null);
    if (!person) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    assertPersonHasCpf(person, 'responsável');

    const guardianId = await this.guardianRepo.create(data);
    if (!guardianId) {
      const existing = await this.guardianRepo.findIdByPersonId(data.personId);

      throw new ConflictError({
        message: 'Esta pessoa já é responsável',
        cause: { guardianId: existing },
      });
    }

    // `viewerId` null: o responsável recém-criado ainda não responde por criança nenhuma, e
    // o recorte de leitura o esconderia de quem acabou de cadastrá-lo.
    const guardian = await this.guardianRepo.findById(guardianId, data.actorId, null);
    if (!guardian) throw new InternalServerError({ message: 'Responsável gravado mas não relido' });

    return guardian;
  }
}
