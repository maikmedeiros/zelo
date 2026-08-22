-- TODO(rls): ligar isto exige um `SET LOCAL app.usuario_id` no início de cada
-- transação/checkout de conexão do pool. Enquanto não estiver ligado no provider, as
-- políticas abaixo ficam criadas mas o papel da aplicação continua BYPASSRLS.
--
-- Mudança em relação à v1: o identificador do ator passa a ser `usuario.id` (uuid). O
-- modelo v2 não tem `handle` — a identidade estável do login é a própria PK.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zelo_app') THEN
    CREATE ROLE zelo_app NOLOGIN;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION app_usuario_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.usuario_id', true), '')::uuid
$$;

-- As três — e apenas as três — origens de escopo de turma do modelo v2. Não há atalho por
-- cargo: coordenação e direção entram por ACESSO_TURMA como todo mundo.
CREATE OR REPLACE VIEW turma_no_escopo AS
  SELECT DISTINCT m.turma_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ra.data_fim IS NULL
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND m.data_fim IS NULL
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT pt.turma_id
  FROM usuario u
  INNER JOIN professor p       ON p.pessoa_id = u.pessoa_id AND p.ativo
  INNER JOIN professor_turma pt ON pt.professor_id = p.id AND pt.data_fim IS NULL
  WHERE u.id = app_usuario_id() AND u.ativo

  UNION

  SELECT DISTINCT ac.turma_id
  FROM usuario u
  INNER JOIN acesso_turma ac ON ac.usuario_id = u.id AND ac.data_fim IS NULL
  WHERE u.id = app_usuario_id() AND u.ativo;

ALTER TABLE postagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_audiencia ON postagem
  FOR SELECT
  USING (
    app_usuario_id() IS NULL
    OR turma_id IN (SELECT turma_id FROM turma_no_escopo)
  );

ALTER TABLE relatorio_adaptacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY relatorio_audiencia ON relatorio_adaptacao
  FOR SELECT
  USING (
    app_usuario_id() IS NULL
    OR turma_id IN (SELECT turma_id FROM turma_no_escopo)
  );

-- As tabelas dependentes herdam o recorte pela existência da linha-pai: se a postagem não
-- passa na política acima, o EXISTS não enxerga nada.
ALTER TABLE postagem_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_aluno_audiencia ON postagem_aluno
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));

ALTER TABLE midia ENABLE ROW LEVEL SECURITY;

CREATE POLICY midia_audiencia ON midia
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));

ALTER TABLE midia_variante ENABLE ROW LEVEL SECURITY;

CREATE POLICY midia_variante_audiencia ON midia_variante
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM midia m WHERE m.id = midia_id));

ALTER TABLE relatorio_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY relatorio_item_audiencia ON relatorio_item
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM relatorio_adaptacao r WHERE r.id = relatorio_id));
