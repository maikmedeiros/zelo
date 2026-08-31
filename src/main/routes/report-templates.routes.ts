import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateReportTemplateController,
  makeDeleteReportTemplateController,
  makeFindListReportTemplatesController,
  makeFindReportTemplateByIdController,
  makeUpdateReportTemplateController,
} from '@main/factories/report-templates/index.js';
import {
  createReportTemplateValidator,
  findListReportTemplatesValidator,
  reportTemplateParamsValidator,
  updateReportTemplateValidator,
} from '@modules/presentation/validators/report-templates/index.js';

export default (router: Router): void => {
  router.get(
    '/report-templates',
    authz.canRequest(Feature.ReportTemplateView),
    findListReportTemplatesValidator,
    controller(makeFindListReportTemplatesController()),
  );

  router.post(
    '/report-templates',
    authz.canRequest(Feature.ReportTemplateCreate),
    createReportTemplateValidator,
    controller(makeCreateReportTemplateController()),
  );

  router.get(
    '/report-templates/:templateId',
    authz.canRequest(Feature.ReportTemplateView),
    reportTemplateParamsValidator,
    controller(makeFindReportTemplateByIdController()),
  );

  router.patch(
    '/report-templates/:templateId',
    authz.canRequest(Feature.ReportTemplateUpdate),
    updateReportTemplateValidator,
    controller(makeUpdateReportTemplateController()),
  );

  router.delete(
    '/report-templates/:templateId',
    authz.canRequest(Feature.ReportTemplateDelete),
    reportTemplateParamsValidator,
    controller(makeDeleteReportTemplateController()),
  );
};
