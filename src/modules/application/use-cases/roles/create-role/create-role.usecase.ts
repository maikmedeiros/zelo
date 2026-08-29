import { ConflictError, InternalServerError, ValidationError } from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { Role } from '../../../../domain/entities/role.js';
import {
  CreateRoleData,
  IRoleRepository,
} from '../../../../domain/repositories/i-role-repository.js';
import { ScopeChecker, assertNoEscalation } from '../assert-no-escalation.js';

export class CreateRoleUseCase {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(data: CreateRoleData, scopesOf: ScopeChecker): Promise<Role> {
    assertNoEscalation(data.permissions, scopesOf);
    await this.assertPermissionsExist(data.permissions.map((permission) => permission.code));

    // Perfil e concessões na mesma transação: perfil gravado sem as permissões seria um
    // perfil que não faz nada, e ninguém pediu isso.
    const roleId = await this.db.transaction(() => this.roleRepo.create(data));

    if (!roleId) {
      throw new ConflictError({
        message: `Já existe um perfil com o código ${data.code}`,
        cause: { code: data.code },
      });
    }

    const role = await this.roleRepo.findById(roleId, data.actorId);
    if (!role) throw new InternalServerError({ message: 'Perfil gravado mas não relido' });

    return role;
  }

  private async assertPermissionsExist(codes: string[]): Promise<void> {
    const unknown = await this.roleRepo.findUnknownPermissions(codes);
    if (unknown.length === 0) return;

    // O schema já valida contra o enum `Feature`; chegar aqui significa que o enum e a tabela
    // `PERMISSAO` divergiram, que é a mesma deriva vigiada no boot por `assertFeaturesInSync`.
    throw new ValidationError({
      message: 'Capability inexistente no catálogo',
      cause: { unknown },
    });
  }
}
