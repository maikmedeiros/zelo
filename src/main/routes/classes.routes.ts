import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateClassController,
  makeDeleteClassController,
  makeFindClassByIdController,
  makeFindListClassesController,
  makeUpdateClassController,
} from '@main/factories/classes/index.js';
import {
  createClassValidator,
  deleteClassValidator,
  findClassByIdValidator,
  findListClassesValidator,
  updateClassValidator,
} from '@modules/presentation/validators/classes/index.js';

export default (router: Router): void => {
  router.get(
    '/classes',
    authz.canRequest(Feature.ClassView),
    findListClassesValidator,
    controller(makeFindListClassesController()),
  );

  router.post(
    '/classes',
    authz.canRequest(Feature.ClassCreate),
    createClassValidator,
    controller(makeCreateClassController()),
  );

  router.get(
    '/classes/:classId',
    authz.canRequest(Feature.ClassView),
    findClassByIdValidator,
    controller(makeFindClassByIdController()),
  );

  router.patch(
    '/classes/:classId',
    authz.canRequest(Feature.ClassUpdate),
    updateClassValidator,
    controller(makeUpdateClassController()),
  );

  router.delete(
    '/classes/:classId',
    authz.canRequest(Feature.ClassDelete),
    deleteClassValidator,
    controller(makeDeleteClassController()),
  );
};
