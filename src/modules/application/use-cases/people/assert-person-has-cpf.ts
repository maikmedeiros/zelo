import { UnprocessableEntityError } from '@shared/errors/index.js';
import { Person } from '../../../domain/entities/person.js';

/**
 * Papel adulto exige CPF.
 *
 * O cadastro acontece em duas etapas — pessoa primeiro, papel depois — e o que impede a mesma
 * pessoa de virar duas linhas é o índice `uq_pessoa_cpf`. Só que no PostgreSQL `NULL` não
 * colide com `NULL`: sem CPF preenchido, esse índice **não protege nada**, e nada impediria
 * uma segunda "Ana Ribeiro" com o login numa linha e o filho na outra.
 *
 * `POST /people` continua aceitando pessoa sem CPF, porque criança sem CPF é a regra e não a
 * exceção. A exigência vive aqui, onde a duplicata custa caro: responsável e professor.
 */
export const assertPersonHasCpf = (person: Person, papel: string): void => {
  if (person.cpf) return;

  throw new UnprocessableEntityError({
    message: `CPF é obrigatório para o papel de ${papel}`,
    cause: { personId: person.id, motivo: 'CPF ausente não impede pessoa duplicada' },
  });
};
