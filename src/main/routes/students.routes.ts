import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateConsentController,
  makeCreateStudentController,
  makeDeleteStudentController,
  makeFindListConsentsController,
  makeFindListStudentsController,
  makeFindStudentByIdController,
  makeRevokeConsentController,
  makeUpdateStudentController,
} from '@main/factories/students/index.js';
import {
  createConsentValidator,
  createStudentValidator,
  deleteStudentValidator,
  findListConsentsValidator,
  findListStudentsValidator,
  findStudentByIdValidator,
  revokeConsentValidator,
  updateStudentValidator,
} from '@modules/presentation/validators/students/index.js';

export default (router: Router): void => {
  router.get(
    '/students',
    authz.canRequest(Feature.StudentView),
    findListStudentsValidator,
    controller(makeFindListStudentsController()),
  );

  router.post(
    '/students',
    authz.canRequest(Feature.StudentCreate),
    createStudentValidator,
    controller(makeCreateStudentController()),
  );

  router.get(
    '/students/:studentId/consents',
    authz.canRequest(Feature.ConsentView),
    findListConsentsValidator,
    controller(makeFindListConsentsController()),
  );

  router.post(
    '/students/:studentId/consents',
    authz.canRequest(Feature.ConsentCreate),
    createConsentValidator,
    controller(makeCreateConsentController()),
  );

  router.delete(
    '/students/:studentId/consents/:consentId',
    authz.canRequest(Feature.ConsentRevoke),
    revokeConsentValidator,
    controller(makeRevokeConsentController()),
  );

  router.get(
    '/students/:studentId',
    authz.canRequest(Feature.StudentView),
    findStudentByIdValidator,
    controller(makeFindStudentByIdController()),
  );

  router.patch(
    '/students/:studentId',
    authz.canRequest(Feature.StudentUpdate),
    updateStudentValidator,
    controller(makeUpdateStudentController()),
  );

  router.delete(
    '/students/:studentId',
    authz.canRequest(Feature.StudentDelete),
    deleteStudentValidator,
    controller(makeDeleteStudentController()),
  );
};
