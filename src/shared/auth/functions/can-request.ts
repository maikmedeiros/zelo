import { RequestHandler } from 'express';
import { ForbiddenError, InternalServerError } from '@shared/errors/index.js';
import { RequestWithContext } from '../actor.js';
import { assertCapability, can } from './can.js';

export const canRequest = (feature: string): RequestHandler => {
  assertCapability(feature);

  return (req, _res, next) => {
    const { context } = req as unknown as Partial<RequestWithContext>;

    if (!context?.actor) {
      throw new InternalServerError({
        message: 'canRequest sem ator no contexto — injectActor precisa rodar antes',
      });
    }

    if (!can(context.actor, feature)) {
      throw new ForbiddenError({ message: `Sem permissão para ${feature}` });
    }

    next();
  };
};
