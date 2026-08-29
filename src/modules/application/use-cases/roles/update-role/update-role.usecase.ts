import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { Role } from '../../../../domain/entities/role.js';
import {
  IRoleRepository,
  UpdateRoleData,
} from '../../../../domain/repositories/i-role-repository.js';
import { ScopeChecker, assertNoEscalation } from '../assert-no-escalation.js';

export class UpdateRoleUseCase {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(
    roleId: string,
    data: UpdateRoleData,
    actorId: string,
    scopesOf: ScopeChecker,
  ): Promise<Role> {
    const atual = await this.roleRepo.findById(roleId, actorId);
    if (!atual) throw new NotFoundError({ message: 'Perfil não encontrado' });

    // O perfil de sistema é a base do modelo de autorização e vem de migration. Editá-lo em
    // runtime é o caminho mais curto para alguém se dar permissões que não tinha.
    if (atual.system) {
      throw new ForbiddenError({
        message: 'Perfil de sistema não é editável pela API',
        cause: { code: atual.code },
      });
    }

    if (data.permissions) {
      assertNoEscalation(data.permissions, scopesOf);

      const unknown = await this.roleRepo.findUnknownPermissions(
        data.permissions.map((permission) => permission.code),
      );
      if (unknown.length > 0) {
        throw new ValidationError({
          message: 'Capability inexistente no catálogo',
          cause: { unknown },
        });
      }
    }

    const permissions = data.permissions;

    await this.db.transaction(async () => {
      const alterado = await this.roleRepo.update(roleId, data);
      if (!alterado) throw new InternalServerError({ message: 'Perfil não pôde ser alterado' });

      if (permissions) await this.roleRepo.replacePermissions(roleId, permissions);
    });

    const role = await this.roleRepo.findById(roleId, actorId);
    if (!role) throw new InternalServerError({ message: 'Perfil alterado mas não relido' });

    return role;
  }
}
