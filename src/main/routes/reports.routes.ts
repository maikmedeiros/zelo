import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateReportController,
  makeDeleteReportController,
  makeFindListReportsController,
  makeFindReportByIdController,
  makePublishReportController,
  makeUpdateReportController,
} from '@main/factories/reports/index.js';
import {
  createReportValidator,
  findListReportsValidator,
  reportParamsValidator,
  updateReportValidator,
} from '@modules/presentation/validators/reports/index.js';

export default (router: Router): void => {
  router.get(
    '/reports',
    authz.canRequest(Feature.ReportView),
    findListReportsValidator,
    controller(makeFindListReportsController()),
  );

  router.post(
    '/reports',
    authz.canRequest(Feature.ReportCreate),
    createReportValidator,
    controller(makeCreateReportController()),
  );

  router.post(
    '/reports/:reportId/publication',
    authz.canRequest(Feature.ReportPublish),
    reportParamsValidator,
    controller(makePublishReportController()),
  );

  router.get(
    '/reports/:reportId',
    authz.canRequest(Feature.ReportView),
    reportParamsValidator,
    controller(makeFindReportByIdController()),
  );

  router.patch(
    '/reports/:reportId',
    authz.canRequest(Feature.ReportUpdate),
    updateReportValidator,
    controller(makeUpdateReportController()),
  );

  router.delete(
    '/reports/:reportId',
    authz.canRequest(Feature.ReportDelete),
    reportParamsValidator,
    controller(makeDeleteReportController()),
  );
};
