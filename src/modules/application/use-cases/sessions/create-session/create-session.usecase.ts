import { randomBytes } from 'node:crypto';
import { hashToken } from '@shared/auth/index.js';
import { UnauthorizedError } from '@shared/errors/index.js';
import { verifyPassword } from '@shared/utils/password/index.js';
import { CreateSessionInput } from '../../../dtos/sessions/create-session/input.js';
import { ISessionRepository } from '../../../../domain/repositories/i-session-repository.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export interface CreateSessionContext {
  ip: string | null;
  userAgent: string | null;
}

export interface OpenedSession {
  token: string;
  expiresAt: Date;
  userId: string;
}

const DECOY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$qVAjXJLzPTMALQeCeVdw4w$HmV7JpkIZYal60LULZ1K+TM6BDbRLISPiI0XYfg24GY';

export class CreateSessionUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
  ) {}

  async execute(input: CreateSessionInput, context: CreateSessionContext): Promise<OpenedSession> {
    const credentials = await this.userRepo.findCredentialsByEmail(input.email);

    const passwordMatches = await verifyPassword(
      credentials?.passwordHash ?? DECOY_HASH,
      input.password,
    );

    if (!credentials || !passwordMatches) {
      throw new UnauthorizedError({ message: 'E-mail ou senha inválidos' });
    }

    const token = randomBytes(32).toString('base64url');

    const validity = await this.sessionRepo.create({
      userId: credentials.id,
      tokenHash: hashToken(token),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { token, expiresAt: validity.expiresAt, userId: credentials.id };
  }
}
