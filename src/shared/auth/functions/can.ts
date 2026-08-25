import { Actor, ResourceScope, SCOPES, Scope } from '../actor.js';
import { InternalServerError } from '@shared/errors/index.js';

const CAPABILITY = /^[A-Z][A-Z_]*:[A-Z][A-Z_]*$/;

const assertCapability = (feature: string): void => {
  if (!CAPABILITY.test(feature)) {
    throw new InternalServerError({
      message: `Capability malformada: "${feature}". Esperado ACAO:RECURSO, sem escopo.`,
    });
  }
};

const matchesResource: Record<Scope, (actor: Actor, resource: ResourceScope) => boolean> = {
  PROPRIA: (actor, resource) => resource.ownerId !== undefined && resource.ownerId === actor.id,
  TURMA: (actor, resource) =>
    resource.groupId !== undefined && actor.groups.includes(resource.groupId),
  ESCOLA: () => true,
};

export const scopesOf = (actor: Actor, feature: string): Scope[] => {
  assertCapability(feature);
  return SCOPES.filter((scope) => actor.features.includes(`${feature}:${scope}`));
};

export function can(actor: Actor, feature: string): boolean;
export function can(actor: Actor, feature: string, resource: ResourceScope): boolean;
export function can(actor: Actor, feature: string, ...rest: [ResourceScope?]): boolean {
  const scopes = scopesOf(actor, feature);
  if (scopes.length === 0) return false;

  if (rest.length === 0) return true;

  const resource = rest[0] ?? {};
  return scopes.some((scope) => matchesResource[scope](actor, resource));
}

export { assertCapability };
