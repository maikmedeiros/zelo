import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { RoleGrant } from '../../../../domain/entities/role-grant.js';
import {
  CreateRoleGrantData,
  IRoleGrantRepository,
} from '../../../../domain/repositories/i-role-grant-repository.js';
import { IRoleRepository } from '../../../../domain/repositories/i-role-repository.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';
import { ScopeChecker, assertNoEscalation } from '../../roles/assert-no-escalation.js';

export interface CreateRoleGrantInputData extends CreateRoleGrantData {
  actorId: string;
}

export class CreateRoleGrantUseCase {
  constructor(
    private readonly grantRepo: IRoleGrantRepository,
    private readonly roleRepo: IRoleRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(data: CreateRoleGrantInputData, scopesOf: ScopeChecker): Promise<RoleGrant> {
    const user = await this.userRepo.findById(data.userId, data.actorId, null);
    if (!user) throw new NotFoundError({ message: 'Usuário não encontrado' });

    const role = await this.roleRepo.findById(data.roleId, data.actorId);
    if (!role) throw new NotFoundError({ message: 'Perfil não encontrado' });

    // Conceder um perfil é conceder tudo o que ele carrega. Sem esta checagem, `CREATE:ROLE`
    // seria dispensável para escalar: bastaria dar a si mesmo o perfil ADMINISTRADOR que já
    // existe. Ninguém dá o que não tem, mesmo quando o pacote foi montado por outro.
    assertNoEscalation(role.permissions, scopesOf);

    const grantId = await this.grantRepo.create(data);
    if (!grantId) {
      throw new ConflictError({
        message: 'Este usuário já tem este perfil com concessão vigente',
        cause: { userId: data.userId, roleId: data.roleId },
      });
    }

    const grant = await this.grantRepo.findById(grantId, data.actorId);
    if (!grant) throw new InternalServerError({ message: 'Concessão gravada mas não relida' });

    return grant;
  }
}
