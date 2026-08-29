import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { CreateRoleUseCase } from '@modules/application/use-cases/roles/create-role/create-role.usecase.js';
import { RoleRepository } from '@modules/infra/repositories/role.repository.js';
import { CreateRoleController } from '@modules/presentation/controllers/roles/create-role/create-role.controller.js';

export const makeCreateRoleController = (): CreateRoleController =>
  new CreateRoleController(
    new CreateRoleUseCase(new RoleRepository(db.core), db.core),
    authz.scopesOf,
  );
