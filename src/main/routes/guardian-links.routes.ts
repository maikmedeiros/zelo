import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateGuardianLinkController,
  makeFindListGuardianLinksController,
  makeRevokeGuardianLinkController,
  makeUpdateGuardianLinkController,
} from '@main/factories/guardian-links/index.js';
import {
  createGuardianLinkValidator,
  findListGuardianLinksValidator,
  revokeGuardianLinkValidator,
  updateGuardianLinkValidator,
} from '@modules/presentation/validators/guardian-links/index.js';

// O `DELETE` **encerra** (`data_fim`), não apaga — por isso a capability é `REVOKE`. O
// consentimento assinado por este responsável continua tendo de apontar para o vínculo que
// o autorizava na data em que foi dado.
export default (router: Router): void => {
  router.get(
    '/guardian-links',
    authz.canRequest(Feature.GuardianLinkView),
    findListGuardianLinksValidator,
    controller(makeFindListGuardianLinksController()),
  );

  router.post(
    '/guardian-links',
    authz.canRequest(Feature.GuardianLinkCreate),
    createGuardianLinkValidator,
    controller(makeCreateGuardianLinkController()),
  );

  router.patch(
    '/guardian-links/:linkId',
    authz.canRequest(Feature.GuardianLinkUpdate),
    updateGuardianLinkValidator,
    controller(makeUpdateGuardianLinkController()),
  );

  router.delete(
    '/guardian-links/:linkId',
    authz.canRequest(Feature.GuardianLinkRevoke),
    revokeGuardianLinkValidator,
    controller(makeRevokeGuardianLinkController()),
  );
};
