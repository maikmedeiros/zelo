import { ACTIVE_PERIOD } from './vigencia.js';

/**
 * Recorte de audiência da postagem, em SQL.
 *
 * Espelha as views da RLS — `turma_no_escopo` da 002, `turma_da_equipe` e `aluno_no_escopo`
 * da 005 — mas parametrizado por `@viewerId`. As views filtram por `app_usuario_id()`, o GUC
 * que só passa a ser alimentado na Fase 6; até lá a aplicação precisa da própria grafia.
 *
 * São duas grafias da mesma regra e elas têm de concordar: mexeu aqui, confira as views.
 */

export { ACTIVE_PERIOD } from './vigencia.js';

/** As três origens de vínculo do modelo v2, unidas. */
export const TURMA_NO_ESCOPO = `
  SELECT m.turma_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND ${ACTIVE_PERIOD('m')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT pt.turma_id
  FROM usuario u
  INNER JOIN professor pr       ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT ac.turma_id
  FROM acesso_turma ac
  WHERE ac.usuario_id = @viewerId::uuid AND ${ACTIVE_PERIOD('ac')}
`;

/** Só as origens de EQUIPE — professor e acesso concedido. Sem o caminho do responsável. */
export const TURMA_DA_EQUIPE = `
  SELECT pt.turma_id
  FROM usuario u
  INNER JOIN professor pr       ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT ac.turma_id
  FROM acesso_turma ac
  WHERE ac.usuario_id = @viewerId::uuid AND ${ACTIVE_PERIOD('ac')}
`;

/** Os alunos sob responsabilidade do ator. */
export const ALUNO_NO_ESCOPO = `
  SELECT ra.aluno_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  WHERE u.id = @viewerId::uuid
`;

/**
 * A postagem alcança o ator. `alias` é o alias da tabela `postagem` na consulta.
 *
 * No modo ALUNO o responsável entra **pelo aluno** e a equipe **pela turma do aluno**, em
 * ramos separados de propósito: um único ramo por turma faria o responsável de qualquer
 * criança daquela turma enxergar a postagem individual sobre a criança dos outros.
 *
 * A autoria é ramo próprio porque o vínculo que deu acesso na hora de escrever expira: a
 * criança muda de turma, o professor troca de sala, e quem escreveu perderia o próprio
 * texto. Autor enxerga o que escreveu, sempre.
 */
export const visivelParaAtor = (alias: string): string => `
  ${alias}.autor_id = @viewerId::uuid
  OR EXISTS (
    SELECT 1 FROM postagem_turma pt
    WHERE pt.postagem_id = ${alias}.id AND pt.turma_id IN (${TURMA_NO_ESCOPO})
  )
  OR EXISTS (
    SELECT 1 FROM postagem_aluno pa
    WHERE pa.postagem_id = ${alias}.id AND pa.aluno_id IN (${ALUNO_NO_ESCOPO})
  )
  OR EXISTS (
    SELECT 1 FROM postagem_aluno pa
    INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND ${ACTIVE_PERIOD('m')}
    WHERE pa.postagem_id = ${alias}.id AND m.turma_id IN (${TURMA_DA_EQUIPE})
  )
`;

/**
 * O aluno pode ser nomeado para o ator. `coluna` é a expressão do id do aluno.
 *
 * Poder ver a postagem não é poder ver todos os destinatários dela: uma postagem para duas
 * crianças de turmas diferentes alcança as duas famílias, e nenhuma delas tem vínculo com a
 * criança da outra. O recorte da linha é uma coisa; o do conteúdo é outra.
 */
export const alunoVisivelParaAtor = (coluna: string): string => `
  @viewerId::uuid IS NULL
  OR ${coluna} IN (${ALUNO_NO_ESCOPO})
  OR EXISTS (
    SELECT 1 FROM matricula mv
    WHERE mv.aluno_id = ${coluna} AND ${ACTIVE_PERIOD('mv')}
      AND mv.turma_id IN (${TURMA_DA_EQUIPE})
  )
`;
