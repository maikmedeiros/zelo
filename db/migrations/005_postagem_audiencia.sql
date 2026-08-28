-- Audiência da postagem: por turmas (1..N) ou por alunos (1..N).
--
-- O que muda em relação à 001. A `postagem` tinha `turma_id NOT NULL` — uma turma, sempre
-- uma, obrigatória. Passa a ter um **modo de destinatário exclusivo**:
--
--   TURMA — a postagem vai para 1..N turmas (`postagem_turma`). Quem tem escopo sobre
--           qualquer uma delas enxerga: responsáveis de matriculados, professores e quem
--           tem ACESSO_TURMA.
--   ALUNO — a postagem vai para 1..N alunos (`postagem_aluno`), possivelmente de turmas
--           diferentes. Enxerga quem é responsável de algum dos alunos, mais a equipe da
--           turma onde cada aluno está matriculado.
--
-- Os dois modos são mutuamente exclusivos: quem escreve escolhe um, e o outro fica vazio.
--
-- MUDANÇA DE SIGNIFICADO em `postagem_aluno`. Na 001 a tabela marcava "quais crianças
-- aparecem no registro" — rótulo, sem efeito sobre visibilidade. Agora ela é **audiência**:
-- as linhas dizem para quem a postagem é. Nenhum código lia a tabela com o sentido antigo,
-- então a troca não quebra nada, mas o sentido é outro e o `zelo_v2.dbml` precisa
-- acompanhar.
--
-- Por que a equipe entra pela matrícula, e o responsável não. Se a regra do modo ALUNO
-- fosse só "turma do aluno", o responsável de QUALQUER criança daquela turma enxergaria a
-- postagem individual sobre a criança dos outros — o vazamento exato que este projeto
-- existe para impedir. Por isso a visibilidade do modo ALUNO tem dois caminhos separados:
-- responsável entra **pelo aluno**, equipe entra **pela turma do aluno**.

CREATE TYPE destinatario_postagem AS ENUM ('TURMA', 'ALUNO');

-- =============================================================================
-- 1. COLUNA DE MODO E TABELA DE AUDIÊNCIA POR TURMA
-- =============================================================================

ALTER TABLE postagem
  ADD COLUMN destinatario destinatario_postagem NOT NULL DEFAULT 'TURMA';

-- O DEFAULT existe só para a migração da linha que já está no banco. Depois de preenchido,
-- sai: escolher o destinatário é decisão de quem publica, não do esquema.
ALTER TABLE postagem ALTER COLUMN destinatario DROP DEFAULT;

CREATE TABLE postagem_turma (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  turma_id    uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_postagem_turma ON postagem_turma (postagem_id, turma_id);
CREATE INDEX idx_postagem_turma_turma ON postagem_turma (turma_id);

-- Preserva o vínculo que já existia antes de a coluna sumir.
INSERT INTO postagem_turma (postagem_id, turma_id)
SELECT p.id, p.turma_id FROM postagem p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. RLS — as políticas antigas referenciam postagem.turma_id
-- =============================================================================
-- Precisam cair antes do DROP COLUMN, e voltar já na forma nova.

DROP POLICY IF EXISTS postagem_audiencia ON postagem;

-- Só as origens de EQUIPE. A `turma_no_escopo` da 002 mistura os três caminhos, e no modo
-- ALUNO isso vazaria a postagem para os responsáveis das outras crianças da turma.
CREATE OR REPLACE VIEW turma_da_equipe AS
  SELECT DISTINCT pt.turma_id
  FROM usuario u
  INNER JOIN professor p        ON p.pessoa_id = u.pessoa_id AND p.ativo
  INNER JOIN professor_turma pt ON pt.professor_id = p.id AND pt.data_fim IS NULL
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT ac.turma_id
  FROM acesso_turma ac
  INNER JOIN usuario u ON u.id = ac.usuario_id AND u.ativo
  WHERE ac.usuario_id = app_usuario_id() AND ac.data_fim IS NULL;

-- Os alunos sob responsabilidade do ator. É o caminho pelo qual o responsável — e só ele —
-- alcança a postagem individual.
CREATE OR REPLACE VIEW aluno_no_escopo AS
  SELECT DISTINCT ra.aluno_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ra.data_fim IS NULL
  WHERE u.id = app_usuario_id() AND u.ativo;

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
      INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND m.data_fim IS NULL
      WHERE pa.postagem_id = postagem.id
        AND m.turma_id IN (SELECT turma_id FROM turma_da_equipe)
    )
  );

-- A tabela de audiência herda o recorte da postagem, como as demais dependentes da 002.
ALTER TABLE postagem_turma ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_turma_audiencia ON postagem_turma
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));

-- =============================================================================
-- 3. A COLUNA ANTIGA SAI
-- =============================================================================
-- Destrutiva de propósito, e agora é o momento mais barato: o único dado de postagem no
-- banco é o de demonstração, recriável por `npm run db:seed`. Manter a coluna ao lado da
-- tabela nova seria manter duas verdades sobre a mesma pergunta.

ALTER TABLE postagem DROP COLUMN turma_id;

CREATE INDEX idx_postagem_feed_v2 ON postagem (publicado_em DESC) WHERE status = 'PUBLICADA';

-- O índice da 001 era (turma_id, publicado_em) e morreu junto com a coluna.

-- =============================================================================
-- 4. CARDINALIDADE MÍNIMA
-- =============================================================================
-- "Modo TURMA exige ao menos uma turma" é invariante entre tabelas: CHECK não alcança, e
-- FK também não. Um trigger de constraint DEFERRABLE é o único jeito de o banco garantir,
-- porque a postagem e suas linhas de audiência são gravadas na mesma transação — validar
-- na hora do INSERT da postagem reprovaria toda escrita legítima.

CREATE FUNCTION postagem_exige_audiencia() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  total integer;
BEGIN
  IF NEW.destinatario = 'TURMA' THEN
    SELECT count(*) INTO total FROM postagem_turma WHERE postagem_id = NEW.id;
    IF total = 0 THEN
      RAISE EXCEPTION 'Postagem % com destinatario TURMA e nenhuma turma', NEW.id;
    END IF;

    SELECT count(*) INTO total FROM postagem_aluno WHERE postagem_id = NEW.id;
    IF total > 0 THEN
      RAISE EXCEPTION 'Postagem % com destinatario TURMA nao pode ter aluno', NEW.id;
    END IF;
  ELSE
    SELECT count(*) INTO total FROM postagem_aluno WHERE postagem_id = NEW.id;
    IF total = 0 THEN
      RAISE EXCEPTION 'Postagem % com destinatario ALUNO e nenhum aluno', NEW.id;
    END IF;

    SELECT count(*) INTO total FROM postagem_turma WHERE postagem_id = NEW.id;
    IF total > 0 THEN
      RAISE EXCEPTION 'Postagem % com destinatario ALUNO nao pode ter turma', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER postagem_audiencia_coerente
  AFTER INSERT OR UPDATE ON postagem
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION postagem_exige_audiencia();
