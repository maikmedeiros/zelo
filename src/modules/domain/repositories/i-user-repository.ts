import { AuthenticatedUser, UserCredentials } from '../entities/user.js';

export interface IUserRepository {
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  findAuthenticatedById(userId: string): Promise<AuthenticatedUser | null>;
}
