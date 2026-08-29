import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateClassAccessController,
  makeFindListClassAccessesController,
  makeRevokeClassAccessController,
} from '@main/factories/class-accesses/index.js';
import {
  createClassAccessValidator,
  findListClassAccessesValidator,
  revokeClassAccessValidator,
} from '@modules/presentation/validators/class-accesses/index.js';

// A terceira origem de escopo do modelo, e a única concedida por decisão administrativa em
// vez de vínculo. O `DELETE` encerra: o acesso passado é a trilha de auditoria de quem viu o
// quê, por quê e a mando de quem.
export default (router: Router): void => {
  router.get(
    '/class-accesses',
    authz.canRequest(Feature.ClassAccessView),
    findListClassAccessesValidator,
    controller(makeFindListClassAccessesController()),
  );

  router.post(
    '/class-accesses',
    authz.canRequest(Feature.ClassAccessCreate),
    createClassAccessValidator,
    controller(makeCreateClassAccessController()),
  );

  router.delete(
    '/class-accesses/:accessId',
    authz.canRequest(Feature.ClassAccessRevoke),
    revokeClassAccessValidator,
    controller(makeRevokeClassAccessController()),
  );
};
