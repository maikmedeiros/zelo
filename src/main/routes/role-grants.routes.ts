import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateRoleGrantController,
  makeFindListRoleGrantsController,
  makeRevokeRoleGrantController,
} from '@main/factories/role-grants/index.js';
import {
  createRoleGrantValidator,
  findListRoleGrantsValidator,
  revokeRoleGrantValidator,
} from '@modules/presentation/validators/role-grants/index.js';

// Conceder um perfil é conceder tudo o que ele carrega — por isso o `assertNoEscalation` vale
// aqui também. Sem ele, bastaria dar a si mesmo o ADMINISTRADOR que já existe.
export default (router: Router): void => {
  router.get(
    '/role-grants',
    authz.canRequest(Feature.RoleGrantView),
    findListRoleGrantsValidator,
    controller(makeFindListRoleGrantsController()),
  );

  router.post(
    '/role-grants',
    authz.canRequest(Feature.RoleGrantCreate),
    createRoleGrantValidator,
    controller(makeCreateRoleGrantController()),
  );

  router.delete(
    '/role-grants/:grantId',
    authz.canRequest(Feature.RoleGrantRevoke),
    revokeRoleGrantValidator,
    controller(makeRevokeRoleGrantController()),
  );
};
