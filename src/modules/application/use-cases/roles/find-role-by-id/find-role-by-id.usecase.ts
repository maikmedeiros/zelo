import { NotFoundError } from '@shared/errors/index.js';
import { Role } from '../../../../domain/entities/role.js';
import { IRoleRepository } from '../../../../domain/repositories/i-role-repository.js';

export class FindRoleByIdUseCase {
  constructor(private readonly roleRepo: IRoleRepository) {}

  async execute(roleId: string, actorId: string): Promise<Role> {
    const role = await this.roleRepo.findById(roleId, actorId);
    if (!role) throw new NotFoundError({ message: 'Perfil não encontrado' });

    return role;
  }
}
