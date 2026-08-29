import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateRoleController,
  makeFindListRolesController,
  makeFindRoleByIdController,
  makeUpdateRoleController,
} from '@main/factories/roles/index.js';
import {
  createRoleValidator,
  findListRolesValidator,
  findRoleByIdValidator,
  updateRoleValidator,
} from '@modules/presentation/validators/roles/index.js';

// Esta é a rota que **fabrica permissão**, e por isso ela carrega duas guardas que as outras
// não têm: perfil de sistema não é editável, e ninguém concede capability que o próprio ator
// não tem (`assertNoEscalation`). Sem elas, `CREATE:ROLE` seria equivalente a ser admin.
//
// Não existe `DELETE`: `usuario_perfil.perfil_id` é ON DELETE RESTRICT, e a concessão passada
// é o que explica o que aquele usuário podia fazer na data em que fez.
export default (router: Router): void => {
  router.get(
    '/roles',
    authz.canRequest(Feature.RoleView),
    findListRolesValidator,
    controller(makeFindListRolesController()),
  );

  router.post(
    '/roles',
    authz.canRequest(Feature.RoleCreate),
    createRoleValidator,
    controller(makeCreateRoleController()),
  );

  router.get(
    '/roles/:roleId',
    authz.canRequest(Feature.RoleView),
    findRoleByIdValidator,
    controller(makeFindRoleByIdController()),
  );

  router.patch(
    '/roles/:roleId',
    authz.canRequest(Feature.RoleUpdate),
    updateRoleValidator,
    controller(makeUpdateRoleController()),
  );
};
