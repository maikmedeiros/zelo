import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateEnrollmentController,
  makeFindListEnrollmentsController,
  makeRevokeEnrollmentController,
} from '@main/factories/enrollments/index.js';
import {
  createEnrollmentValidator,
  findListEnrollmentsValidator,
  revokeEnrollmentValidator,
} from '@modules/presentation/validators/enrollments/index.js';

// O `DELETE` **encerra** (`data_fim`), não apaga — por isso a capability é `REVOKE`. A
// matrícula passada é o que explica a presença da criança no feed do ano anterior.
export default (router: Router): void => {
  router.get(
    '/enrollments',
    authz.canRequest(Feature.EnrollmentView),
    findListEnrollmentsValidator,
    controller(makeFindListEnrollmentsController()),
  );

  router.post(
    '/enrollments',
    authz.canRequest(Feature.EnrollmentCreate),
    createEnrollmentValidator,
    controller(makeCreateEnrollmentController()),
  );

  router.delete(
    '/enrollments/:enrollmentId',
    authz.canRequest(Feature.EnrollmentRevoke),
    revokeEnrollmentValidator,
    controller(makeRevokeEnrollmentController()),
  );
};
