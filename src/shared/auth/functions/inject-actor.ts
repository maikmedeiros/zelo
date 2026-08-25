import { RequestHandler } from 'express';
import { UnauthorizedError } from '@shared/errors/index.js';
import { RequestWithContext } from '../actor.js';
import { ActorModel } from '../model/actor-model.js';

export const createInjectActor = (model: ActorModel): RequestHandler => {
  return async (req, _res, next) => {
    const actor = await model.fromRequest(req);
    if (!actor) throw new UnauthorizedError();

    (req as unknown as RequestWithContext).context = { actor };
    next();
  };
};
