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

/**
 * A abrangência mais ampla que o ator tem para a capability, ou `null` se não tem nenhuma.
 *
 * `scopesOf` devolve todas — o que serve para perguntar "tem ESCOLA?". Quando a consulta
 * precisa de **um** recorte para montar o filtro, é a mais ampla que vale: ter `PROPRIA` e
 * `TURMA` ao mesmo tempo significa alcançar a turma, não menos.
 */
export const widestScope = (actor: Actor, feature: string): Scope | null => {
  const scopes = scopesOf(actor, feature);
  // SCOPES está em ordem crescente de amplitude, então o último presente é o mais amplo.
  return scopes.length > 0 ? (scopes[scopes.length - 1] as Scope) : null;
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
