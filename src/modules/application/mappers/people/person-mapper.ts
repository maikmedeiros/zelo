import { PaginatedRow } from '@shared/infra/database/index.js';
import { Person } from '../../../domain/entities/person.js';

export interface PersonOutput {
  id: string;
  name: string;
  socialName: string | null;
  birthDate: string | null;
  cpf: string | null;
  phone: string | null;
  contactEmail: string | null;
  roles: { student: boolean; guardian: boolean; teacher: boolean };
  hasUser: boolean;
}

export interface PersonPersistenceRow extends PaginatedRow {
  ID: string;
  NOME: string;
  NOME_SOCIAL: string | null;
  DATA_NASCIMENTO: string | null;
  CPF: string | null;
  TELEFONE: string | null;
  EMAIL_CONTATO: string | null;
  E_ALUNO: boolean;
  E_RESPONSAVEL: boolean;
  E_PROFESSOR: boolean;
  TEM_USUARIO: boolean;
}

export class PersonMapper {
  static fromPersistence(row: PersonPersistenceRow): Person {
    return {
      id: row.ID,
      name: row.NOME,
      socialName: row.NOME_SOCIAL,
      birthDate: row.DATA_NASCIMENTO,
      cpf: row.CPF,
      phone: row.TELEFONE,
      contactEmail: row.EMAIL_CONTATO,
      roles: {
        student: row.E_ALUNO,
        guardian: row.E_RESPONSAVEL,
        teacher: row.E_PROFESSOR,
      },
      hasUser: row.TEM_USUARIO,
    };
  }

  // O CPF sai inteiro. Mascará-lo inviabilizaria a única coisa que a busca serve para fazer
  // — confirmar que esta Ana é aquela Ana antes de cadastrar a segunda. Quem enxerga já
  // precisou de `VIEW:PERSON`, que é capability de secretaria, não de professor.
  static toOutput(person: Person): PersonOutput {
    return { ...person };
  }
}
