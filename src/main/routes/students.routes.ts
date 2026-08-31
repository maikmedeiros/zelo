import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateConsentController,
  makeCreateJournalEntryController,
  makeCreateStudentController,
  makeDeleteJournalEntryController,
  makeDeleteStudentController,
  makeFindListConsentsController,
  makeFindListJournalEntriesController,
  makeFindListStudentsController,
  makeFindStudentByIdController,
  makeRevokeConsentController,
  makeUpdateJournalEntryController,
  makeUpdateStudentController,
} from '@main/factories/students/index.js';
import {
  createConsentValidator,
  createJournalEntryValidator,
  createStudentValidator,
  deleteJournalEntryValidator,
  deleteStudentValidator,
  findListConsentsValidator,
  findListJournalEntriesValidator,
  findListStudentsValidator,
  findStudentByIdValidator,
  revokeConsentValidator,
  updateJournalEntryValidator,
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
    '/students/:studentId/journal',
    authz.canRequest(Feature.JournalView),
    findListJournalEntriesValidator,
    controller(makeFindListJournalEntriesController()),
  );

  router.post(
    '/students/:studentId/journal',
    authz.canRequest(Feature.JournalCreate),
    createJournalEntryValidator,
    controller(makeCreateJournalEntryController()),
  );

  router.patch(
    '/students/:studentId/journal/:entryId',
    authz.canRequest(Feature.JournalUpdate),
    updateJournalEntryValidator,
    controller(makeUpdateJournalEntryController()),
  );

  router.delete(
    '/students/:studentId/journal/:entryId',
    authz.canRequest(Feature.JournalDelete),
    deleteJournalEntryValidator,
    controller(makeDeleteJournalEntryController()),
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
