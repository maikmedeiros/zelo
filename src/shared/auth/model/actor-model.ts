import { createHash } from 'node:crypto';
import { Request } from 'express';
import { InternalServerError } from '@shared/errors/index.js';
import { Actor, RawActor, SCOPES, Scope } from '../actor.js';
import { IActorRepository } from '../i-actor-repository.js';

export interface ActorModelConfig {
  cookieName: string;
  apiTokenPrefix: string;
  groups: boolean;
}

export interface ActorModel {
  fromRequest(req: Request): Promise<Actor | undefined>;
}

export const hashToken = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const isScope = (value: string): value is Scope => (SCOPES as readonly string[]).includes(value);

const assertScopedFeatures = (features: string[]): void => {
  for (const feature of features) {
    const scope = feature.split(':')[2];

    if (scope === undefined || !isScope(scope)) {
      throw new InternalServerError({
        message: `Feature com escopo inválido vinda do banco: "${feature}"`,
      });
    }
  }
};

export const readCookie = (req: Request, name: string): string | undefined => {
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

const readBearer = (req: Request): string | undefined => {
  const header = req.header('authorization');
  if (!header) return undefined;

  const [esquema, valor] = header.split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !valor) return undefined;

  return valor;
};

export const createActorModel = (
  repository: IActorRepository,
  config: ActorModelConfig,
): ActorModel => ({
  async fromRequest(req) {
    const apiToken = readBearer(req);
    const sessionToken = readCookie(req, config.cookieName);

    let resolved: RawActor | null = null;

    if (apiToken) {
      if (!apiToken.startsWith(config.apiTokenPrefix)) return undefined;
      resolved = await repository.findActorByApiToken(hashToken(apiToken));
    } else if (sessionToken) {
      resolved = await repository.findActorBySessionToken(hashToken(sessionToken));
    } else {
      return undefined;
    }

    if (!resolved) return undefined;

    assertScopedFeatures(resolved.features);

    if (!config.groups && resolved.features.some((feature) => feature.endsWith(':TURMA'))) {
      throw new InternalServerError({
        message: 'Ator tem feature de abrangência TURMA, mas a resolução de grupos está desligada',
      });
    }

    const groups = config.groups ? await repository.findGroups(resolved.id) : [];

    return { ...resolved, groups };
  },
});
