export type ActorKind = 'user' | 'api-token';

export const SCOPES = ['PROPRIA', 'TURMA', 'ESCOLA'] as const;
export type Scope = (typeof SCOPES)[number];

export interface Actor {
  id: string;
  kind: ActorKind;
  name: string;
  features: string[];
  groups: string[];
}

export type RawActor = Omit<Actor, 'groups'>;

export interface RequestContext {
  actor: Actor;
}

export interface RequestWithContext {
  context: RequestContext;
}

export interface ResourceScope {
  ownerId?: string;
  groupId?: string;
}
