import { RequestHandler } from 'express';
import { Actor, ResourceScope, Scope } from './actor.js';
import { IActorRepository } from './i-actor-repository.js';
import { ActorModelConfig, createActorModel } from './model/actor-model.js';
import { can, scopesOf } from './functions/can.js';
import { canRequest } from './functions/can-request.js';
import { createInjectActor } from './functions/inject-actor.js';
import {
  SessionCookie,
  SessionCookieConfig,
  createSessionCookie,
} from './functions/session-cookie.js';

export * from './actor.js';
export * from './i-actor-repository.js';
export * from './model/actor-model.js';
export * from './functions/can.js';
export * from './functions/can-request.js';
export * from './functions/inject-actor.js';
export * from './functions/session-cookie.js';

export type AuthConfig = ActorModelConfig & SessionCookieConfig;

export interface Auth {
  injectActor: RequestHandler;
  canRequest: (feature: string) => RequestHandler;
  can: {
    (actor: Actor, feature: string): boolean;
    (actor: Actor, feature: string, resource: ResourceScope): boolean;
  };
  scopesOf: (actor: Actor, feature: string) => Scope[];
  sessionCookie: SessionCookie;
}

export const createAuth = (repository: IActorRepository, config: AuthConfig): Auth => {
  const model = createActorModel(repository, config);
  const sessionCookie = createSessionCookie(config);

  return {
    injectActor: createInjectActor(model, sessionCookie, config.cookieName),
    canRequest,
    can,
    scopesOf,
    sessionCookie,
  };
};
