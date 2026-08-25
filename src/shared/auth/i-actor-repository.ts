import { RawActor } from './actor.js';

export interface IActorRepository {
  findActorBySessionToken(tokenHash: string): Promise<RawActor | null>;
  findActorByApiToken(tokenHash: string): Promise<RawActor | null>;
  findGroups(usuarioId: string): Promise<string[]>;
}
