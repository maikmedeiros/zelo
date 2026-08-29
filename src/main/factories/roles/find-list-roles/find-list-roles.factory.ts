import { db } from '@config/database.js';
import { FindListRolesUseCase } from '@modules/application/use-cases/roles/find-list-roles/find-list-roles.usecase.js';
import { RoleRepository } from '@modules/infra/repositories/role.repository.js';
import { FindListRolesController } from '@modules/presentation/controllers/roles/find-list-roles/find-list-roles.controller.js';

export const makeFindListRolesController = (): FindListRolesController =>
  new FindListRolesController(new FindListRolesUseCase(new RoleRepository(db.core)));
