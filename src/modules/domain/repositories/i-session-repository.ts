import { SessionValidity } from '../entities/session.js';

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<SessionValidity>;
  deleteByTokenHash(tokenHash: string): Promise<boolean>;
}
