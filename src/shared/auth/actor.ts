export type ActorKind = 'user' | 'api-key';

/**
 * Identidade resolvida da requisição.
 *
 * - `handle` é o identificador ESTÁVEL (para usuário, o `username`; para api key, o próprio
 *   UUID). É o que se grava em coluna de autoria e o que o escopo `:own` compara.
 * - `name` é rótulo de EXIBIÇÃO. Nunca grave `name` em coluna de autoria.
 * - `features` são as capabilities COM escopo (`ZELO:postagem:list:any`).
 */
export interface Actor {
  id: string;
  kind: ActorKind;
  handle: string;
  name: string;
  features: string[];
}

export interface RequestContext {
  actor: Actor;
}

export interface RequestWithContext {
  context: RequestContext;
}

/** Escopos possíveis de uma capability. NÃO entram no enum `Feature`. */
export type CapabilityScope = 'own' | 'group' | 'any';
