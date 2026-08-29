import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateTeacherLinkController,
  makeFindListTeacherLinksController,
  makeRevokeTeacherLinkController,
} from '@main/factories/teacher-links/index.js';
import {
  createTeacherLinkValidator,
  findListTeacherLinksValidator,
  revokeTeacherLinkValidator,
} from '@modules/presentation/validators/teacher-links/index.js';

// Encerrar o vínculo tira o escopo de leitura, mas não a autoria: as postagens que este
// professor escreveu continuam visíveis para ele pelo ramo de autoria de `visivelParaAtor`.
export default (router: Router): void => {
  router.get(
    '/teacher-links',
    authz.canRequest(Feature.TeacherLinkView),
    findListTeacherLinksValidator,
    controller(makeFindListTeacherLinksController()),
  );

  router.post(
    '/teacher-links',
    authz.canRequest(Feature.TeacherLinkCreate),
    createTeacherLinkValidator,
    controller(makeCreateTeacherLinkController()),
  );

  router.delete(
    '/teacher-links/:linkId',
    authz.canRequest(Feature.TeacherLinkRevoke),
    revokeTeacherLinkValidator,
    controller(makeRevokeTeacherLinkController()),
  );
};
