import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IClassAccessRepository } from '../../../../domain/repositories/i-class-access-repository.js';

export class RevokeClassAccessUseCase {
  constructor(private readonly accessRepo: IClassAccessRepository) {}

  async execute(accessId: string, actorId: string): Promise<void> {
    const access = await this.accessRepo.findById(accessId, actorId, null);
    if (!access) throw new NotFoundError({ message: 'Acesso não encontrado' });

    // Encerrar, não apagar: o acesso passado é a trilha de auditoria de quem viu o quê, por
    // quê e a mando de quem — que é o registro de defesa da escola numa questão de LGPD.
    const encerrado = await this.accessRepo.revoke(accessId);
    if (!encerrado) {
      throw new ConflictError({
        message: 'Acesso já encerrado',
        cause: { endDate: access.endDate },
      });
    }
  }
}
