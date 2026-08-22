import { Router } from 'express';
import authz from '@config/authz.js';
import { env } from '@config/env.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import { createUpload } from '@shared/middlewares/index.js';
import {
  createPostagemValidator,
  deletePostagemValidator,
  findListPostagensValidator,
  findPostagemByIdValidator,
} from '@modules/presentation/validators/postagens/index.js';
import {
  makeCreatePostagemController,
  makeDeletePostagemController,
  makeFindListPostagensController,
  makeFindPostagemByIdController,
} from '@main/factories/postagens/index.js';

const upload = createUpload({ maxFileSizeBytes: env.storage.maxFileSizeBytes });

export default (router: Router): void => {
  router.get(
    '/postagens',
    authz.canRequest(Feature.PostagemList), // 1. autorização (403)
    findListPostagensValidator, // 2. validação (400)
    controller(makeFindListPostagensController()), // 3. adapter → IController
  );

  // Upload: o multer entra ENTRE a autorização e o validator — sem isso o `req.body` do
  // multipart chega vazio no validator.
  router.post(
    '/postagens',
    authz.canRequest(Feature.PostagemCreate),
    upload.array('midias', 10),
    createPostagemValidator,
    controller(makeCreatePostagemController()),
  );

  // ROTAS ESTÁTICAS ANTES DE PARAMS — senão `:postagemId` captura o segmento estático.
  router.get(
    '/postagens/:postagemId',
    authz.canRequest(Feature.PostagemRead),
    findPostagemByIdValidator,
    controller(makeFindPostagemByIdController()),
  );

  router.delete(
    '/postagens/:postagemId',
    authz.canRequest(Feature.PostagemDelete),
    deletePostagemValidator,
    controller(makeDeletePostagemController()),
  );
};
