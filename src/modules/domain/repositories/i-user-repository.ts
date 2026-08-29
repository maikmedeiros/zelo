import { AuthenticatedUser, UserAccount, UserCredentials } from '../entities/user.js';
import { PageInfo } from './pagination.js';

export interface ListUsersFilters {
  page: number;
  limit: number;
  /** Trecho do e-mail ou do nome da pessoa. */
  search: string | null;
  active: boolean | null;
  /** Código de perfil (`ADMINISTRADOR`, `PROFESSOR`, ...). */
  profile: string | null;
  actorId: string;
  // `null` é o ator de abrangência ESCOLA. Quem decide é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListUsersResult {
  items: UserAccount[];
  pagination: PageInfo;
}

export interface CreateUserData {
  personId: string;
  email: string;
  /** Já em argon2id — o use-case aplica o hash antes de chegar aqui. */
  passwordHash: string;
  actorId: string;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  active?: boolean;
}

export interface IUserRepository {
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  findAuthenticatedById(userId: string): Promise<AuthenticatedUser | null>;

  list(filters: ListUsersFilters): Promise<ListUsersResult>;
  findById(userId: string, actorId: string, viewerId: string | null): Promise<UserAccount | null>;

  /** Quem já tem login para esta pessoa (`usuario.pessoa_id` é UNIQUE). */
  findIdByPersonId(personId: string): Promise<string | null>;
  findIdByEmail(email: string): Promise<string | null>;

  /** `null` quando a pessoa já tem login ou o e-mail já está em uso. */
  create(data: CreateUserData): Promise<string | null>;

  /** `false` quando o novo e-mail já pertence a outro usuário. */
  update(userId: string, data: UpdateUserData): Promise<boolean>;

  /** Encerra toda sessão e revoga todo token do usuário. Usado na troca de senha e na
   * desativação: mudar a credencial e deixar a sessão antiga de pé não muda nada. */
  revokeAccess(userId: string, revokedBy: string): Promise<void>;
}
