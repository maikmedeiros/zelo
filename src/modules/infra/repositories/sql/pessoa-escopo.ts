import { ACTIVE_PERIOD, TURMA_NO_ESCOPO } from './turma-escopo.js';

/**
 * As pessoas que o ator alcança quando **não** tem abrangência ESCOLA: ele mesmo, os alunos
 * das turmas do seu escopo, os responsáveis desses alunos e os professores dessas turmas.
 *
 * Hoje só a coordenação recebe `VIEW:PERSON`, e com `ESCOLA` — então este recorte não tem
 * consumidor. Ele existe mesmo assim porque a alternativa não é "nenhum filtro por ora": é
 * uma listagem que devolve a escola inteira no instante em que alguém conceder `VIEW:PERSON`
 * com `TURMA` na Fase 3b. Toda outra listagem do projeto tem o seu recorte; a de pessoas sem
 * o dela é que seria a anomalia.
 */
export const PESSOA_NO_ESCOPO = `
  SELECT u.pessoa_id
  FROM usuario u
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT a.pessoa_id
  FROM aluno a
  INNER JOIN matricula m ON m.aluno_id = a.id AND ${ACTIVE_PERIOD('m')}
  WHERE m.turma_id IN (${TURMA_NO_ESCOPO})

  UNION

  SELECT r.pessoa_id
  FROM responsavel r
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND ${ACTIVE_PERIOD('m')}
  WHERE m.turma_id IN (${TURMA_NO_ESCOPO})

  UNION

  SELECT pr.pessoa_id
  FROM professor pr
  INNER JOIN professor_turma pt ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE pt.turma_id IN (${TURMA_NO_ESCOPO})
`;
