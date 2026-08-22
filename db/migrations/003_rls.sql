-- Row Level Security como SEGUNDA linha de defesa do isolamento por turma.
--
-- A primeira é a CTE `turma_visivel` em `postagem.repository.ts`. Esta camada existe para
-- o caso de uma query nova esquecer o filtro: defesa em profundidade, não substituição.
--
-- Como funciona: a aplicação declara o ator da requisição em `app.actor_handle` (um GUC de
-- sessão) e as políticas leem esse valor. Cabe ao provider de banco setá-lo por transação.
--
-- TODO(rls): ligar isto exige um `SET LOCAL app.actor_handle` no início de cada
-- transação/checkout de conexão do pool. Enquanto não estiver ligado no provider, as
-- políticas abaixo ficam criadas mas o papel da aplicação continua BYPASSRLS.

-- Papel da aplicação. Enquanto a RLS não estiver ligada no provider, ele é dono das
-- tabelas (e portanto ignora políticas), o que mantém o sistema funcionando.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zelo_app') THEN
    CREATE ROLE zelo_app NOLOGIN;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION app_actor_handle() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.actor_handle', true), '')
$$;

-- Turmas visíveis ao ator corrente. É a MESMA regra da CTE da aplicação, num só lugar do
-- banco: responsável via filho matriculado, professor via atribuição.
CREATE OR REPLACE VIEW turma_visivel_atual AS
  SELECT DISTINCT m.turma_id
  FROM usuario u
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = u.id
  INNER JOIN matricula m ON m.aluno_id = ra.aluno_id AND m.ativa = true
  WHERE u.handle = app_actor_handle() AND u.ativo = true
  UNION
  SELECT DISTINCT tp.turma_id
  FROM usuario u
  INNER JOIN turma_professor tp ON tp.professor_id = u.id
  WHERE u.handle = app_actor_handle() AND u.ativo = true;

ALTER TABLE postagem ENABLE ROW LEVEL SECURITY;

-- Perfis com visão global (direcao/coordenacao) passam por esta política; os demais
-- ficam restritos às turmas visíveis.
CREATE POLICY postagem_audiencia ON postagem
  FOR SELECT
  USING (
    app_actor_handle() IS NULL
    OR EXISTS (
      SELECT 1 FROM usuario u
      WHERE u.handle = app_actor_handle()
        AND u.perfil IN ('direcao', 'coordenacao')
    )
    OR turma_id IN (SELECT turma_id FROM turma_visivel_atual)
  );

ALTER TABLE postagem_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_aluno_audiencia ON postagem_aluno
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));

ALTER TABLE postagem_midia ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_midia_audiencia ON postagem_midia
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));
