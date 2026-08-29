import { Router } from 'express';
import authz from '@config/authz.js';
import { env } from '@config/env.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import { singleFile } from '@shared/middlewares/index.js';
import {
  makeCreatePersonController,
  makeDeletePhotoController,
  makeFindListPeopleController,
  makeFindPersonByIdController,
  makeFindPhotoController,
  makeUpdatePersonController,
  makeUpdatePhotoController,
} from '@main/factories/people/index.js';
import {
  createPersonValidator,
  findListPeopleValidator,
  findPersonByIdValidator,
  personPhotoValidator,
  updatePersonValidator,
} from '@modules/presentation/validators/people/index.js';

// O multer entra ENTRE a autorização e o validator: antes dele o corpo multipart ainda não
// foi lido, e depois dele o validator já encontra `req.file`. Deixá-lo antes do `canRequest`
// faria o servidor gastar upload de quem nem podia pedir.
const uploadPhoto = singleFile('file', { maxFileSizeBytes: env.storage.maxFileSizeBytes });

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

  // Rota estática antes da de param — CLAUDE.md §5. Aqui o segmento fixo vem DEPOIS do
  // param, então a ordem entre elas não conflita; ficam juntas por serem o mesmo recurso.
  router.get(
    '/people/:personId/photo',
    authz.canRequest(Feature.PhotoView),
    personPhotoValidator,
    controller(makeFindPhotoController()),
  );

  router.put(
    '/people/:personId/photo',
    authz.canRequest(Feature.PhotoUpdate),
    uploadPhoto,
    personPhotoValidator,
    controller(makeUpdatePhotoController()),
  );

  router.delete(
    '/people/:personId/photo',
    authz.canRequest(Feature.PhotoUpdate),
    personPhotoValidator,
    controller(makeDeletePhotoController()),
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
