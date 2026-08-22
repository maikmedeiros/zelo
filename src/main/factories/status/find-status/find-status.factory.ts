import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { FindStatusUseCase } from '@modules/application/use-cases/status/find-status/find-status.usecase.js';
import { StatusRepository } from '@modules/infra/repositories/status.repository.js';
import { FindStatusController } from '@modules/presentation/controllers/status/find-status/find-status.controller.js';

export const makeFindStatusController = (): FindStatusController => {
  const statusRepo = new StatusRepository(db.core);
  const usecase = new FindStatusUseCase(statusRepo, {
    service: 'zelo-api',
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.nodeEnv,
  });

  return new FindStatusController(usecase);
};
