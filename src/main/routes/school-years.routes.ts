import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateSchoolYearController,
  makeDeleteSchoolYearController,
  makeFindListSchoolYearsController,
  makeFindSchoolYearByIdController,
  makeUpdateSchoolYearController,
} from '@main/factories/school-years/index.js';
import {
  createSchoolYearValidator,
  deleteSchoolYearValidator,
  findListSchoolYearsValidator,
  findSchoolYearByIdValidator,
  updateSchoolYearValidator,
} from '@modules/presentation/validators/school-years/index.js';

export default (router: Router): void => {
  router.get(
    '/school-years',
    authz.canRequest(Feature.SchoolYearView),
    findListSchoolYearsValidator,
    controller(makeFindListSchoolYearsController()),
  );

  router.post(
    '/school-years',
    authz.canRequest(Feature.SchoolYearCreate),
    createSchoolYearValidator,
    controller(makeCreateSchoolYearController()),
  );

  router.get(
    '/school-years/:schoolYearId',
    authz.canRequest(Feature.SchoolYearView),
    findSchoolYearByIdValidator,
    controller(makeFindSchoolYearByIdController()),
  );

  router.patch(
    '/school-years/:schoolYearId',
    authz.canRequest(Feature.SchoolYearUpdate),
    updateSchoolYearValidator,
    controller(makeUpdateSchoolYearController()),
  );

  router.delete(
    '/school-years/:schoolYearId',
    authz.canRequest(Feature.SchoolYearDelete),
    deleteSchoolYearValidator,
    controller(makeDeleteSchoolYearController()),
  );
};
