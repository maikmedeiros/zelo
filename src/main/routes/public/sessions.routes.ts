import { Router } from 'express';
import { controller } from '@shared/adapters/index.js';
import { createSessionValidator } from '@modules/presentation/validators/sessions/index.js';
import { makeCreateSessionController } from '@main/factories/sessions/index.js';

export default (router: Router): void => {
  router.post('/sessions', createSessionValidator, controller(makeCreateSessionController()));
};
