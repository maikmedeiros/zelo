import { RequestHandler } from 'express';

/**
 * Não há o que validar: a rota não tem params, corpo nem filtro. O validator existe para a
 * rota manter a mesma forma das outras — `canRequest → validator → controller`.
 */
export const findListReactionTypesValidator: RequestHandler = (_req, _res, next) => next();
