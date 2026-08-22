import { Actor } from './actor.js';

export interface IActorRepository {
  findActorBySessionToken(tokenHash: string): Promise<Actor | null>;
  findActorByApiKey(keyHash: string): Promise<Actor | null>;
}
