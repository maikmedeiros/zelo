import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { ClassAccess } from '../../../../domain/entities/class-access.js';
import {
  CreateClassAccessData,
  IClassAccessRepository,
} from '../../../../domain/repositories/i-class-access-repository.js';
import { IClassRepository } from '../../../../domain/repositories/i-class-repository.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export interface CreateClassAccessInputData extends CreateClassAccessData {
  actorId: string;
}

export class CreateClassAccessUseCase {
  constructor(
    private readonly accessRepo: IClassAccessRepository,
    private readonly userRepo: IUserRepository,
    private readonly classRepo: IClassRepository,
  ) {}

  async execute(data: CreateClassAccessInputData): Promise<ClassAccess> {
    const user = await this.userRepo.findById(data.userId, data.actorId, null);
    if (!user) throw new NotFoundError({ message: 'Usuário não encontrado' });

    const turma = await this.classRepo.findById(data.classId, data.actorId, null);
    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    const accessId = await this.accessRepo.create(data);
    if (!accessId) {
      throw new ConflictError({
        message: 'Este usuário já tem acesso vigente a esta turma',
        cause: { userId: data.userId, classId: data.classId },
      });
    }

    const access = await this.accessRepo.findById(accessId, data.actorId, null);
    if (!access) throw new InternalServerError({ message: 'Acesso gravado mas não relido' });

    return access;
  }
}
