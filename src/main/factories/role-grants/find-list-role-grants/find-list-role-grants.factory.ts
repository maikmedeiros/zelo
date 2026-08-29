import { db } from '@config/database.js';
import { FindListRoleGrantsUseCase } from '@modules/application/use-cases/role-grants/find-list-role-grants/find-list-role-grants.usecase.js';
import { RoleGrantRepository } from '@modules/infra/repositories/role-grant.repository.js';
import { FindListRoleGrantsController } from '@modules/presentation/controllers/role-grants/find-list-role-grants/find-list-role-grants.controller.js';

export const makeFindListRoleGrantsController = (): FindListRoleGrantsController =>
  new FindListRoleGrantsController(new FindListRoleGrantsUseCase(new RoleGrantRepository(db.core)));
