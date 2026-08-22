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
    authz.canRequest(Feature.PostagemList),
    findListPostagensValidator,
    controller(makeFindListPostagensController()),
  );

  router.post(
    '/postagens',
    authz.canRequest(Feature.PostagemCreate),
    upload.array('midias', 10),
    createPostagemValidator,
    controller(makeCreatePostagemController()),
  );

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
