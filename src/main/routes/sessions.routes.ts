import { Router } from 'express';
import { controller } from '@shared/adapters/index.js';
import {
  makeFindCurrentSessionController,
  makeRevokeSessionController,
} from '@main/factories/sessions/index.js';

export default (router: Router): void => {
  router.get('/sessions/current', controller(makeFindCurrentSessionController()));
  router.delete('/sessions/current', controller(makeRevokeSessionController()));
};
