export interface UserCredentials {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}
