import { RequestHandler } from 'express';
import { UnauthorizedError } from '@shared/errors/index.js';
import { RequestWithContext } from '../actor.js';
import { ActorModel, readCookie } from '../model/actor-model.js';
import { SessionCookie } from './session-cookie.js';

export const createInjectActor = (
  model: ActorModel,
  sessionCookie: SessionCookie,
  cookieName: string,
): RequestHandler => {
  return async (req, res, next) => {
    const actor = await model.fromRequest(req);

    if (!actor) {
      if (readCookie(req, cookieName)) sessionCookie.clear(res);
      throw new UnauthorizedError();
    }

    (req as unknown as RequestWithContext).context = { actor };
    next();
  };
};
