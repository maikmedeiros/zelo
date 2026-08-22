import { NextFunction, Request, RequestHandler, Response } from 'express';
import { createHash } from 'node:crypto';
import { ForbiddenError, UnauthorizedError } from '@shared/errors/index.js';
import { Actor, CapabilityScope, RequestWithContext } from './actor.js';
import { IActorRepository } from './i-actor-repository.js';

export interface AuthOptions {
  /** Nome do cookie de sessão. Vem do env: é DISTINTO por ambiente. */
  cookieName: string;
  /** Prefixo esperado no header `x-api-key`. */
  apiKeyPrefix: string;
  /** Fora de development o cookie é escopado no domínio compartilhado. */
  cookieDomain?: string;
  secureCookie: boolean;
}

export interface ResourceScope {
  /** `handle` do dono do recurso — comparado com `actor.handle` no escopo `:own`. */
  ownerHandle?: string;
  /** Ids do "grupo" do recurso (turmas, no Zelo) — usado no escopo `:group`. */
  groupIds?: string[];
  /** Grupos aos quais o ator pertence. Quem carrega isto é o caso de uso. */
  actorGroupIds?: string[];
}

const hashToken = (value: string): string => createHash('sha256').update(value).digest('hex');

/**
 * Extrai o escopo de uma capability concedida. `ZELO:postagem:list:any` → `any`.
 * Concessão sem escopo explícito é tratada como `own`, a leitura mais restritiva.
 */
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

  /**
   * Middleware GLOBAL de autenticação: resolve `req.context.actor` a partir do cookie de
   * sessão ou de uma API key, e devolve 401 se não houver credencial válida.
   *
   * É o único ponto que limpa o cookie — o error handler não tem efeito colateral, então
   * um 401 vindo de outro lugar não prova sessão inválida.
   */
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

    // Token presente que não resolve numa sessão viva: o cookie está velho, some com ele.
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

  /**
   * Autorização POR ROTA — primeiro middleware da rota. Recebe a capability CRUA (sem
   * escopo): possuir a capability em qualquer escopo passa daqui; o recorte `:own` × `:any`
   * é resolvido no controller, que é quem conhece o recurso.
   */
  canRequest(feature: string): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const { actor } = (req as unknown as RequestWithContext).context;

      if (grantsFor(actor, feature).length === 0) {
        throw new ForbiddenError({ message: `Sem permissão para ${feature}` });
      }

      next();
    };
  }

  /** Autorização POR RECURSO, chamada no controller. */
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

  /** `true` quando o ator tem a capability no escopo mais amplo. */
  hasAnyScope(actor: Actor, feature: string): boolean {
    return grantsFor(actor, feature).includes('any');
  }

  /** Hash de token de sessão / api key. Exposto para o fluxo de login usar o MESMO algoritmo. */
  static hashToken = hashToken;
}

// Cookie parser mínimo: só a sessão é lida por cookie, não vale trazer `cookie-parser`
// e mais um middleware global para isso.
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
