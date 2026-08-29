import { Person, PersonRole } from '../entities/person.js';
import { PageInfo } from './pagination.js';

export interface ListPeopleFilters {
  page: number;
  limit: number;
  /** Só dígitos, já normalizado pelo schema. Busca exata — é a chave de identidade. */
  cpf: string | null;
  /** Trecho do nome (ou do nome social). */
  search: string | null;
  /** `null` não filtra; `'none'` traz justamente quem ainda não recebeu papel nenhum. */
  role: PersonRole | 'none' | null;
  actorId: string;
  // `null` é o ator de abrangência ESCOLA. Quem decide é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListPeopleResult {
  items: Person[];
  pagination: PageInfo;
}

export interface CreatePersonData {
  name: string;
  socialName: string | null;
  birthDate: string | null;
  cpf: string | null;
  phone: string | null;
  contactEmail: string | null;
  actorId: string;
}

export interface UpdatePersonData {
  name?: string;
  socialName?: string | null;
  birthDate?: string | null;
  cpf?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
}

export interface IPersonRepository {
  list(filters: ListPeopleFilters): Promise<ListPeopleResult>;
  findById(personId: string, actorId: string, viewerId: string | null): Promise<Person | null>;

  /** Quem já tem este CPF na escola — é o que dá conteúdo ao 409 do cadastro. */
  findIdByCpf(cpf: string, actorId: string): Promise<string | null>;

  /** `null` quando o CPF já pertence a outra pessoa da escola. */
  create(data: CreatePersonData): Promise<string | null>;
  update(personId: string, data: UpdatePersonData): Promise<boolean>;
}
