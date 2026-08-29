import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateStudentController,
  makeDeleteStudentController,
  makeFindListStudentsController,
  makeFindStudentByIdController,
  makeUpdateStudentController,
} from '@main/factories/students/index.js';
import {
  createStudentValidator,
  deleteStudentValidator,
  findListStudentsValidator,
  findStudentByIdValidator,
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
