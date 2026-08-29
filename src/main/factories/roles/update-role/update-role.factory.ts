import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { UpdateRoleUseCase } from '@modules/application/use-cases/roles/update-role/update-role.usecase.js';
import { RoleRepository } from '@modules/infra/repositories/role.repository.js';
import { UpdateRoleController } from '@modules/presentation/controllers/roles/update-role/update-role.controller.js';

export const makeUpdateRoleController = (): UpdateRoleController =>
  new UpdateRoleController(
    new UpdateRoleUseCase(new RoleRepository(db.core), db.core),
    authz.scopesOf,
  );
