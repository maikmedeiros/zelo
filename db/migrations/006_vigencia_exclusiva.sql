-- `data_fim` passa a ser o primeiro dia em que o vínculo NÃO vale.
--
-- O que estava errado. As views da 002 e da 005 tratavam qualquer `data_fim` preenchida como
-- encerramento imediato (`data_fim IS NULL`), e a aplicação lia a mesma coluna de forma
-- inclusiva (`data_fim IS NULL OR data_fim >= CURRENT_DATE`). Duas grafias da mesma regra,
-- discordando — exatamente o que o comentário de `sql/turma-escopo.ts` manda não deixar
-- acontecer. E cada uma errava de um jeito:
--
--   * A aplicação deixava a revogação valer só a partir do dia seguinte. `DELETE
--     /guardian-links/:linkId` devolvia 204 e o responsável continuava enxergando a criança
--     até a virada do dia. Revogar acesso é ato imediato, não agendamento para amanhã.
--   * As views cortavam o acesso no instante em que uma data FUTURA era registrada. "Esta
--     professora sai no fim do ano" tirava a turma dela hoje.
--
-- A leitura que corrige os dois é a exclusiva: `data_fim IS NULL OR data_fim > CURRENT_DATE`.
-- Revogar hoje grava hoje e vale hoje; agendar para dezembro mantém o vínculo até lá.
--
-- O `CHECK (data_fim >= data_inicio)` da 001 continua valendo e admite `data_fim =
-- data_inicio`: é o vínculo criado e revogado no mesmo dia, que nunca chegou a valer.

CREATE OR REPLACE VIEW turma_no_escopo AS
  SELECT DISTINCT m.turma_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id
                                 AND (ra.data_fim IS NULL OR ra.data_fim > CURRENT_DATE)
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id
                                 AND (m.data_fim IS NULL OR m.data_fim > CURRENT_DATE)
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT pt.turma_id
  FROM usuario u
  INNER JOIN professor p        ON p.pessoa_id = u.pessoa_id AND p.ativo
  INNER JOIN professor_turma pt ON pt.professor_id = p.id
                               AND (pt.data_fim IS NULL OR pt.data_fim > CURRENT_DATE)
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT ac.turma_id
  FROM acesso_turma ac
  INNER JOIN usuario u ON u.id = ac.usuario_id AND u.ativo
  WHERE ac.usuario_id = app_usuario_id()
    AND (ac.data_fim IS NULL OR ac.data_fim > CURRENT_DATE);

CREATE OR REPLACE VIEW turma_da_equipe AS
  SELECT DISTINCT pt.turma_id
  FROM usuario u
  INNER JOIN professor p        ON p.pessoa_id = u.pessoa_id AND p.ativo
  INNER JOIN professor_turma pt ON pt.professor_id = p.id
                               AND (pt.data_fim IS NULL OR pt.data_fim > CURRENT_DATE)
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT ac.turma_id
  FROM acesso_turma ac
  INNER JOIN usuario u ON u.id = ac.usuario_id AND u.ativo
  WHERE ac.usuario_id = app_usuario_id()
    AND (ac.data_fim IS NULL OR ac.data_fim > CURRENT_DATE);

CREATE OR REPLACE VIEW aluno_no_escopo AS
  SELECT DISTINCT ra.aluno_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id
                                 AND (ra.data_fim IS NULL OR ra.data_fim > CURRENT_DATE)
  WHERE u.id = app_usuario_id() AND u.ativo;

-- A política da 005 lê `postagem_aluno → matricula`, e ali a matrícula também precisa da
-- leitura nova.
DROP POLICY IF EXISTS postagem_audiencia ON postagem;

CREATE POLICY postagem_audiencia ON postagem
  FOR SELECT
  USING (
    app_usuario_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM postagem_turma pt
      WHERE pt.postagem_id = postagem.id
        AND pt.turma_id IN (SELECT turma_id FROM turma_no_escopo)
    )
    OR EXISTS (
      SELECT 1 FROM postagem_aluno pa
      WHERE pa.postagem_id = postagem.id
        AND pa.aluno_id IN (SELECT aluno_id FROM aluno_no_escopo)
    )
    OR EXISTS (
      SELECT 1 FROM postagem_aluno pa
      INNER JOIN matricula m ON m.aluno_id = pa.aluno_id
                            AND (m.data_fim IS NULL OR m.data_fim > CURRENT_DATE)
      WHERE pa.postagem_id = postagem.id
        AND m.turma_id IN (SELECT turma_id FROM turma_da_equipe)
    )
  );
