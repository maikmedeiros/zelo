export type ActorKind = 'user' | 'api-key';

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

export type CapabilityScope = 'own' | 'group' | 'any';
