import { Algorithm, hash, verify } from '@node-rs/argon2';

const OPTIONS = { algorithm: Algorithm.Argon2id } as const;

export const hashPassword = (senha: string): Promise<string> => hash(senha, OPTIONS);

export const verifyPassword = (senhaHash: string, senha: string): Promise<boolean> =>
  verify(senhaHash, senha);
