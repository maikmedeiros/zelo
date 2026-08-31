-- Agenda: o caderno de recados, um por criança.
--
-- Parece postagem e não é. A postagem é conteúdo da escola para uma audiência — turma ou
-- lista de crianças — escrita por quem tem `CREATE:POST`, com rascunho, mídia e reação. A
-- agenda é uma conversa de mão dupla sobre UMA criança: a professora conta como foi o dia, a
-- família responde ou puxa assunto novo. Tabelas próprias, e não uma flag em `postagem`,
-- porque o que difere é o essencial: quem escreve, para quem, e o que a linha significa.
--
-- Três decisões do cliente em 31/08/2026:
--
--   1. Sem anexo nesta fatia. Os recados são texto. Vídeo entra depois, em tabela própria —
--      e é por isso que não existe `midia_id` aqui esperando uso.
--   2. O responsável PUBLICA e não edita nem apaga. É o caderno de papel: não se arranca a
--      folha, escreve-se embaixo. Preserva o fio da conversa, que é o valor da agenda.
--   3. `responde_a_id` é vínculo de verdade, e não só ordem cronológica: num mesmo dia
--      convivem tosse e alimentação, e sem o vínculo as duas conversas se misturam.
--
-- Não há RASCUNHO. Recado é mensagem: existe quando é escrito. O ciclo de publicação da
-- postagem não faz sentido para quem está avisando que a criança tossiu.
CREATE TYPE status_agenda AS ENUM ('PUBLICADA', 'REMOVIDA_PELO_AUTOR', 'REMOVIDA_PELA_ESCOLA');

CREATE TABLE agenda_entrada (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid NOT NULL REFERENCES aluno (id) ON DELETE RESTRICT,
  turma_id        uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  autor_id        uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  responde_a_id   uuid,
  texto           text NOT NULL,
  data_referencia date NOT NULL DEFAULT current_date,
  status          status_agenda NOT NULL DEFAULT 'PUBLICADA',
  removido_por    uuid REFERENCES usuario (id) ON DELETE SET NULL,
  removido_em     timestamptz,
  motivo_remocao  text,
  editado_em      timestamptz,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agenda_removida_tem_data
    CHECK (status = 'PUBLICADA' OR removido_em IS NOT NULL),
  CONSTRAINT agenda_moderada_tem_motivo
    CHECK (status <> 'REMOVIDA_PELA_ESCOLA' OR motivo_remocao IS NOT NULL),
  CONSTRAINT agenda_nao_responde_a_si
    CHECK (responde_a_id IS NULL OR responde_a_id <> id),
  CONSTRAINT uq_agenda_entrada_aluno UNIQUE (id, aluno_id)
);

-- A resposta é da MESMA criança, e quem garante é o banco. A FK composta usa a unique
-- (id, aluno_id) acima: para apontar como resposta, o alvo tem de coincidir no aluno. Sem
-- isso, um `responde_a_id` trocado costuraria a agenda de duas crianças e o vazamento
-- entraria pela porta da conversa.
ALTER TABLE agenda_entrada
  ADD CONSTRAINT agenda_resposta_mesma_crianca
  FOREIGN KEY (responde_a_id, aluno_id)
  REFERENCES agenda_entrada (id, aluno_id) ON DELETE RESTRICT;

CREATE INDEX idx_agenda_aluno ON agenda_entrada (aluno_id, data_referencia DESC, criado_em DESC);
CREATE INDEX idx_agenda_turma ON agenda_entrada (turma_id);
CREATE INDEX idx_agenda_autor ON agenda_entrada (autor_id);
CREATE INDEX idx_agenda_resposta ON agenda_entrada (responde_a_id) WHERE responde_a_id IS NOT NULL;

-- O recorte é por CRIANÇA, não por turma — e é a primeira policy em que a diferença importa.
-- Um responsável da Maternal I A não pode ler a agenda das outras crianças da Maternal I A,
-- então o ramo da família entra por `aluno_no_escopo`. A equipe entra pela matrícula vigente,
-- e não pela `turma_id` gravada, para que a professora nova acompanhe o histórico da criança
-- que mudou de sala.
ALTER TABLE agenda_entrada ENABLE ROW LEVEL SECURITY;

CREATE POLICY agenda_audiencia ON agenda_entrada
  FOR SELECT
  USING (
    app_usuario_id() IS NULL
    OR autor_id = app_usuario_id()
    OR aluno_id IN (SELECT aluno_id FROM aluno_no_escopo)
    OR EXISTS (
      SELECT 1
      FROM matricula m
      WHERE m.aluno_id = agenda_entrada.aluno_id
        AND (m.data_fim IS NULL OR m.data_fim > CURRENT_DATE)
        AND m.turma_id IN (SELECT turma_id FROM turma_da_equipe)
    )
  );

INSERT INTO permissao (codigo, acao, recurso) VALUES
  ('VIEW:JOURNAL',   'VIEW',   'JOURNAL'),
  ('CREATE:JOURNAL', 'CREATE', 'JOURNAL'),
  ('UPDATE:JOURNAL', 'UPDATE', 'JOURNAL'),
  ('DELETE:JOURNAL', 'DELETE', 'JOURNAL')
ON CONFLICT (codigo) DO NOTHING;

-- O RESPONSAVEL escreve e não corrige: sem UPDATE e sem DELETE, por decisão do cliente.
-- A professora corrige e retira o que ela mesma escreveu (PROPRIA) — mexer no recado da mãe
-- não. A coordenação ganha DELETE em TURMA porque moderação precisa de alguém: recado
-- impróprio sai com motivo e deixa lápide, como no comentário da postagem.
CREATE TEMP TABLE concessao_agenda (perfil text, codigo text, escopo abrangencia);

INSERT INTO concessao_agenda (perfil, codigo, escopo) VALUES
  ('PROFESSOR',   'VIEW:JOURNAL',   'TURMA'),
  ('PROFESSOR',   'CREATE:JOURNAL', 'TURMA'),
  ('PROFESSOR',   'UPDATE:JOURNAL', 'PROPRIA'),
  ('PROFESSOR',   'DELETE:JOURNAL', 'PROPRIA'),
  ('COORDENACAO', 'VIEW:JOURNAL',   'TURMA'),
  ('COORDENACAO', 'CREATE:JOURNAL', 'TURMA'),
  ('COORDENACAO', 'UPDATE:JOURNAL', 'PROPRIA'),
  ('COORDENACAO', 'DELETE:JOURNAL', 'TURMA'),
  ('RESPONSAVEL', 'VIEW:JOURNAL',   'TURMA'),
  ('RESPONSAVEL', 'CREATE:JOURNAL', 'TURMA');

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_agenda c
INNER JOIN perfil f    ON f.codigo = c.perfil AND f.sistema = true
INNER JOIN permissao p ON p.codigo = c.codigo
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = EXCLUDED.abrangencia;

DROP TABLE concessao_agenda;

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'ESCOLA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'ADMINISTRADOR' AND f.sistema = true
  AND p.recurso = 'JOURNAL'
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = 'ESCOLA';
