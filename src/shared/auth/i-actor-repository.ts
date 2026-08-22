import { Actor } from './actor.js';

/**
 * Contrato de resolução de identidade. Mora em `shared/` porque a autenticação é
 * cross-cutting: o módulo de domínio não conhece sessão nem api key.
 */
export interface IActorRepository {
  /** `null` quando o token não resolve numa sessão viva. */
  findActorBySessionToken(tokenHash: string): Promise<Actor | null>;
  /** `null` quando a chave não existe, está inativa ou expirou. */
  findActorByApiKey(keyHash: string): Promise<Actor | null>;
}
