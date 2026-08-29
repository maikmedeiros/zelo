import { db } from '@config/database.js';
import { RevokeRoleGrantUseCase } from '@modules/application/use-cases/role-grants/revoke-role-grant/revoke-role-grant.usecase.js';
import { RoleGrantRepository } from '@modules/infra/repositories/role-grant.repository.js';
import { RevokeRoleGrantController } from '@modules/presentation/controllers/role-grants/revoke-role-grant/revoke-role-grant.controller.js';

export const makeRevokeRoleGrantController = (): RevokeRoleGrantController =>
  new RevokeRoleGrantController(new RevokeRoleGrantUseCase(new RoleGrantRepository(db.core)));
