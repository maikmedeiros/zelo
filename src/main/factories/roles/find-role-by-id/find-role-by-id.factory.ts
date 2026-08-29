import { db } from '@config/database.js';
import { FindRoleByIdUseCase } from '@modules/application/use-cases/roles/find-role-by-id/find-role-by-id.usecase.js';
import { RoleRepository } from '@modules/infra/repositories/role.repository.js';
import { FindRoleByIdController } from '@modules/presentation/controllers/roles/find-role-by-id/find-role-by-id.controller.js';

export const makeFindRoleByIdController = (): FindRoleByIdController =>
  new FindRoleByIdController(new FindRoleByIdUseCase(new RoleRepository(db.core)));
