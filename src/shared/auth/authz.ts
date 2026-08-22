import { NextFunction, Request, RequestHandler, Response } from 'express';
import { createHash } from 'node:crypto';
import { ForbiddenError, UnauthorizedError } from '@shared/errors/index.js';
import { Actor, CapabilityScope, RequestWithContext } from './actor.js';
import { IActorRepository } from './i-actor-repository.js';

export interface AuthOptions {
  cookieName: string;
  apiKeyPrefix: string;
  cookieDomain?: string;
  secureCookie: boolean;
}

export interface ResourceScope {
  ownerHandle?: string;
  groupIds?: string[];
  actorGroupIds?: string[];
}

const hashToken = (value: string): string => createHash('sha256').update(value).digest('hex');

const scopeOf = (granted: string): CapabilityScope => {
  const scope = granted.split(':')[3];
  return scope === 'any' || scope === 'group' ? scope : 'own';
};

const grantsFor = (actor: Actor, feature: string): CapabilityScope[] =>
  actor.features
    .filter((granted) => granted === feature || granted.startsWith(`${feature}:`))
    .map(scopeOf);

export class Authz {
  constructor(
    private readonly actorRepo: IActorRepository,
    private readonly options: AuthOptions,
  ) {}

  readonly injectActor: RequestHandler = async (req, res, next) => {
    const actor = await this.resolveActor(req, res);
    if (!actor) throw new UnauthorizedError({ message: 'Credencial ausente ou inválida' });

    (req as unknown as RequestWithContext).context = { actor };
    next();
  };

  private async resolveActor(req: Request, res: Response): Promise<Actor | null> {
    const rawApiKey = req.header('x-api-key');
    if (rawApiKey) {
      if (!rawApiKey.startsWith(this.options.apiKeyPrefix)) return null;
      return this.actorRepo.findActorByApiKey(hashToken(rawApiKey));
    }

    const sessionToken = readCookie(req, this.options.cookieName);
    if (!sessionToken) return null;

    const actor = await this.actorRepo.findActorBySessionToken(hashToken(sessionToken));

    if (!actor) {
      res.clearCookie(this.options.cookieName, {
        domain: this.options.cookieDomain,
        httpOnly: true,
        sameSite: 'lax',
        secure: this.options.secureCookie,
        path: '/',
      });
    }

    return actor;
  }

  canRequest(feature: string): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const { actor } = (req as unknown as RequestWithContext).context;

      if (grantsFor(actor, feature).length === 0) {
        throw new ForbiddenError({ message: `Sem permissão para ${feature}` });
      }

      next();
    };
  }

  can(actor: Actor, feature: string, resource: ResourceScope = {}): boolean {
    const scopes = grantsFor(actor, feature);
    if (scopes.length === 0) return false;
    if (scopes.includes('any')) return true;

    if (scopes.includes('group') && resource.groupIds?.length && resource.actorGroupIds?.length) {
      const actorGroups = new Set(resource.actorGroupIds);
      if (resource.groupIds.some((id) => actorGroups.has(id))) return true;
    }

    return resource.ownerHandle !== undefined && resource.ownerHandle === actor.handle;
  }

  hasAnyScope(actor: Actor, feature: string): boolean {
    return grantsFor(actor, feature).includes('any');
  }

  static hashToken = hashToken;
}

const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return undefined;
};

export const createAuth = (actorRepo: IActorRepository, options: AuthOptions): Authz =>
  new Authz(actorRepo, options);
