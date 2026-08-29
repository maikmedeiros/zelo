import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { CreateRoleGrantUseCase } from '@modules/application/use-cases/role-grants/create-role-grant/create-role-grant.usecase.js';
import { RoleGrantRepository } from '@modules/infra/repositories/role-grant.repository.js';
import { RoleRepository } from '@modules/infra/repositories/role.repository.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { CreateRoleGrantController } from '@modules/presentation/controllers/role-grants/create-role-grant/create-role-grant.controller.js';

export const makeCreateRoleGrantController = (): CreateRoleGrantController =>
  new CreateRoleGrantController(
    new CreateRoleGrantUseCase(
      new RoleGrantRepository(db.core),
      new RoleRepository(db.core),
      new UserRepository(db.core),
    ),
    authz.scopesOf,
  );
