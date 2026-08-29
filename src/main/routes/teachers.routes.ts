import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateTeacherController,
  makeFindListTeachersController,
  makeFindTeacherByIdController,
  makeUpdateTeacherController,
} from '@main/factories/teachers/index.js';
import {
  createTeacherValidator,
  findListTeachersValidator,
  findTeacherByIdValidator,
  updateTeacherValidator,
} from '@modules/presentation/validators/teachers/index.js';

// Sem DELETE: professor que sai da escola vira `PATCH { active: false }`. A autoria das
// postagens dele continua apontando para a mesma linha, que é o ponto do registro.
export default (router: Router): void => {
  router.get(
    '/teachers',
    authz.canRequest(Feature.TeacherView),
    findListTeachersValidator,
    controller(makeFindListTeachersController()),
  );

  router.post(
    '/teachers',
    authz.canRequest(Feature.TeacherCreate),
    createTeacherValidator,
    controller(makeCreateTeacherController()),
  );

  router.get(
    '/teachers/:teacherId',
    authz.canRequest(Feature.TeacherView),
    findTeacherByIdValidator,
    controller(makeFindTeacherByIdController()),
  );

  router.patch(
    '/teachers/:teacherId',
    authz.canRequest(Feature.TeacherUpdate),
    updateTeacherValidator,
    controller(makeUpdateTeacherController()),
  );
};
