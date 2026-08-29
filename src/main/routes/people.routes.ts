import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreatePersonController,
  makeFindListPeopleController,
  makeFindPersonByIdController,
  makeUpdatePersonController,
} from '@main/factories/people/index.js';
import {
  createPersonValidator,
  findListPeopleValidator,
  findPersonByIdValidator,
  updatePersonValidator,
} from '@modules/presentation/validators/people/index.js';

// Não existe `DELETE /people/:personId`, e nem a capability para ela: pessoa é referenciada
// por matrícula, consentimento e autoria de postagem. Apagar levaria o histórico junto.
export default (router: Router): void => {
  router.get(
    '/people',
    authz.canRequest(Feature.PersonView),
    findListPeopleValidator,
    controller(makeFindListPeopleController()),
  );

  router.post(
    '/people',
    authz.canRequest(Feature.PersonCreate),
    createPersonValidator,
    controller(makeCreatePersonController()),
  );

  router.get(
    '/people/:personId',
    authz.canRequest(Feature.PersonView),
    findPersonByIdValidator,
    controller(makeFindPersonByIdController()),
  );

  router.patch(
    '/people/:personId',
    authz.canRequest(Feature.PersonUpdate),
    updatePersonValidator,
    controller(makeUpdatePersonController()),
  );
};
