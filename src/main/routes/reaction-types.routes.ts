import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import { makeFindListReactionTypesController } from '@main/factories/reaction-types/index.js';
import { findListReactionTypesValidator } from '@modules/presentation/validators/reaction-types/index.js';

// Catálogo de leitura apenas. Aposentar uma reação é `ativo = false` numa migration, nunca
// DELETE: apagar a linha quebraria o histórico de quem já reagiu com ela.
export default (router: Router): void => {
  router.get(
    '/reaction-types',
    authz.canRequest(Feature.ReactionTypeView),
    findListReactionTypesValidator,
    controller(makeFindListReactionTypesController()),
  );
};
