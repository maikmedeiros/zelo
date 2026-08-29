import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateGuardianController,
  makeFindGuardianByIdController,
  makeFindListGuardiansController,
  makeUpdateGuardianController,
} from '@main/factories/guardians/index.js';
import {
  createGuardianValidator,
  findGuardianByIdValidator,
  findListGuardiansValidator,
  updateGuardianValidator,
} from '@modules/presentation/validators/guardians/index.js';

// Sem DELETE — e sem capability para ela. Quem deixa de responder por uma criança tem o
// **vínculo** encerrado (`responsavel_aluno.data_fim`), não o papel apagado: o consentimento
// que essa pessoa registrou continua tendo de apontar para alguém.
export default (router: Router): void => {
  router.get(
    '/guardians',
    authz.canRequest(Feature.GuardianView),
    findListGuardiansValidator,
    controller(makeFindListGuardiansController()),
  );

  router.post(
    '/guardians',
    authz.canRequest(Feature.GuardianCreate),
    createGuardianValidator,
    controller(makeCreateGuardianController()),
  );

  router.get(
    '/guardians/:guardianId',
    authz.canRequest(Feature.GuardianView),
    findGuardianByIdValidator,
    controller(makeFindGuardianByIdController()),
  );

  router.patch(
    '/guardians/:guardianId',
    authz.canRequest(Feature.GuardianUpdate),
    updateGuardianValidator,
    controller(makeUpdateGuardianController()),
  );
};
