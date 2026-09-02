export interface UserCredentials {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface AuthenticatedUser {
  id: string;
  personId: string;
  name: string;
  email: string;
  roles: string[];
}

/**
 * O usuário visto pelo cadastro — outro read model do mesmo conceito, ao lado de
 * `UserCredentials` (login) e `AuthenticatedUser` (sessão corrente). O formato difere
 * porque a pergunta difere: aqui interessa quem é a pessoa por trás, se a conta está ativa
 * e que perfis ela carrega.
 */
export interface UserAccount {
  id: string;
  personId: string;
  personName: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  lastAccessAt: Date | null;
  /** Códigos de PERFIL vigentes. Não confundir com `Person.roles`, que são papéis. */
  profiles: string[];
}
