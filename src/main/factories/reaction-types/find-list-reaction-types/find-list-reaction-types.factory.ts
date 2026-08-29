import { db } from '@config/database.js';
import { FindListReactionTypesUseCase } from '@modules/application/use-cases/reaction-types/find-list-reaction-types/find-list-reaction-types.usecase.js';
import { ReactionRepository } from '@modules/infra/repositories/reaction.repository.js';
import { FindListReactionTypesController } from '@modules/presentation/controllers/reaction-types/find-list-reaction-types/find-list-reaction-types.controller.js';

export const makeFindListReactionTypesController = (): FindListReactionTypesController =>
  new FindListReactionTypesController(
    new FindListReactionTypesUseCase(new ReactionRepository(db.core)),
  );
