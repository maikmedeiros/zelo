-- Schema inicial do Zelo. Aplicar em ordem numérica.
--
-- Convenções: identificadores em snake_case (o alias UPPER_SNAKE das queries vem entre
-- aspas duplas, na projeção); chaves primárias em uuid; `criado_por`/`removido_por`
-- guardam o HANDLE do ator, nunca o nome de exibição.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Identidade e acesso ──────────────────────────────────────────────────────

CREATE TYPE perfil_usuario AS ENUM ('direcao', 'coordenacao', 'professor', 'responsavel');

CREATE TABLE usuario (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador ESTÁVEL do ator. É o que vai para as colunas de autoria e o que o
  -- escopo `:own` compara. Trocar de handle quebraria a trilha, então é imutável.
  handle      text NOT NULL UNIQUE,
  nome        text NOT NULL,
  email       text NOT NULL UNIQUE,
  senha_hash  text NOT NULL,
  perfil      perfil_usuario NOT NULL,
  ativo       boolean NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  criado_por  text
);

CREATE TABLE sessao (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Só o HASH do token é persistido: um dump do banco não permite assumir sessão.
  token_hash  text NOT NULL UNIQUE,
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  expira_em   timestamptz NOT NULL,
  revogada_em timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessao_vigente ON sessao (token_hash) WHERE revogada_em IS NULL;

CREATE TABLE api_key (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  chave_hash  text NOT NULL UNIQUE,
  prefixo     text NOT NULL,
  ativo       boolean NOT NULL DEFAULT true,
  expira_em   timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  criado_por  text NOT NULL
);

-- Capabilities COM escopo (`ZELO:postagem:list:group`). O catálogo cru vive no enum
-- `Feature` da aplicação; o escopo é concedido aqui.
CREATE TABLE perfil_capability (
  perfil     perfil_usuario NOT NULL,
  capability text NOT NULL,
  PRIMARY KEY (perfil, capability)
);

CREATE TABLE api_key_capability (
  api_key_id uuid NOT NULL REFERENCES api_key (id) ON DELETE CASCADE,
  capability text NOT NULL,
  PRIMARY KEY (api_key_id, capability)
);

-- ── Estrutura escolar ────────────────────────────────────────────────────────

CREATE TABLE escola (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  cnpj       text UNIQUE,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE turma (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id  uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  nome       text NOT NULL,
  ano_letivo smallint NOT NULL,
  ativa      boolean NOT NULL DEFAULT true,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  criado_por text NOT NULL,
  UNIQUE (escola_id, nome, ano_letivo)
);

CREATE TABLE aluno (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id         uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  nome              text NOT NULL,
  data_nascimento   date NOT NULL,
  -- Foto de referência para o reconhecimento em conjunto fechado (Fase 2).
  caminho_referencia text,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  criado_por        text NOT NULL
);

CREATE TABLE matricula (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id   uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  turma_id   uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  ativa      boolean NOT NULL DEFAULT true,
  iniciada_em date NOT NULL DEFAULT current_date,
  encerrada_em date,
  criado_por text NOT NULL
);

-- Um aluno tem UMA matrícula ativa por vez; o histórico continua na tabela.
CREATE UNIQUE INDEX idx_matricula_ativa ON matricula (aluno_id) WHERE ativa;
CREATE INDEX idx_matricula_turma ON matricula (turma_id) WHERE ativa;

-- Vínculo N:N: uma criança tem mãe, pai, avó — o modelo precisa suportar.
CREATE TABLE responsavel_aluno (
  responsavel_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  aluno_id       uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  parentesco     text NOT NULL,
  -- Quem pode registrar/revogar consentimento de imagem desta criança.
  pode_consentir boolean NOT NULL DEFAULT true,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  criado_por     text NOT NULL,
  PRIMARY KEY (responsavel_id, aluno_id)
);

CREATE INDEX idx_responsavel_aluno_aluno ON responsavel_aluno (aluno_id);

CREATE TABLE turma_professor (
  turma_id     uuid NOT NULL REFERENCES turma (id) ON DELETE CASCADE,
  professor_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  criado_por   text NOT NULL,
  PRIMARY KEY (turma_id, professor_id)
);

-- ── Feed ─────────────────────────────────────────────────────────────────────

CREATE TABLE postagem (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id      uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  titulo        text NOT NULL,
  texto         text NOT NULL,
  publicada_em  timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz,
  -- Soft delete: o acervo é prova de conformidade, apagar linha destrói a trilha.
  removida_em   timestamptz,
  removida_por  text,
  criado_por    text NOT NULL REFERENCES usuario (handle) ON UPDATE CASCADE
);

-- Índice do feed: filtra por turma e ordena por data, exatamente como a query da lista.
CREATE INDEX idx_postagem_feed ON postagem (turma_id, publicada_em DESC)
  WHERE removida_em IS NULL;

CREATE TABLE postagem_midia (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id      uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  -- Caminho RELATIVO à raiz do storage. Nunca o absoluto, nunca a URL.
  caminho          text NOT NULL,
  -- Variante derivada com faces borradas (Fase 2). O original nunca é alterado.
  caminho_variante text,
  tipo_mime        text NOT NULL,
  tamanho_bytes    bigint NOT NULL,
  hash_conteudo    text NOT NULL,
  ordem            int NOT NULL DEFAULT 0,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  criado_por       text NOT NULL
);

CREATE INDEX idx_postagem_midia_postagem ON postagem_midia (postagem_id, ordem);

CREATE TABLE postagem_aluno (
  postagem_id uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  aluno_id    uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  criado_por  text NOT NULL,
  PRIMARY KEY (postagem_id, aluno_id)
);

CREATE INDEX idx_postagem_aluno_aluno ON postagem_aluno (aluno_id);

-- ── Consentimento e conformidade ─────────────────────────────────────────────

CREATE TYPE tipo_consentimento AS ENUM ('interno', 'redes_sociais', 'material_institucional');
CREATE TYPE origem_consentimento AS ENUM ('app', 'termo_fisico', 'importacao');

-- SÉRIE TEMPORAL, não flag. Um booleano `autoriza_imagem` no aluno apagaria a história e
-- impediria a pergunta que importa: "esta criança tinha autorização NA DATA da foto?".
CREATE TABLE consentimento_imagem (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id      uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  tipo          tipo_consentimento NOT NULL,
  origem        origem_consentimento NOT NULL,
  concedido     boolean NOT NULL,
  vigencia_inicio timestamptz NOT NULL DEFAULT now(),
  vigencia_fim  timestamptz,
  -- Handle do responsável que registrou; `revogado_por` fica nulo até a revogação.
  registrado_por text NOT NULL,
  revogado_em   timestamptz,
  revogado_por  text,
  observacao    text,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vigencia_coerente CHECK (vigencia_fim IS NULL OR vigencia_fim > vigencia_inicio)
);

CREATE INDEX idx_consentimento_vigente ON consentimento_imagem (aluno_id, tipo, vigencia_inicio DESC);

CREATE TABLE relatorio_adaptacao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id      uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  turma_id      uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  periodo_inicio date NOT NULL,
  periodo_fim    date NOT NULL,
  -- Campos estruturados do relatório, versionados pelo próprio conteúdo.
  campos        jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  criado_por    text NOT NULL,
  atualizada_em timestamptz,
  CONSTRAINT periodo_coerente CHECK (periodo_fim >= periodo_inicio)
);

-- Trilha de auditoria: prova de conformidade. Nunca sofre UPDATE nem DELETE.
CREATE TABLE log_auditoria (
  id            bigserial PRIMARY KEY,
  ocorrido_em   timestamptz NOT NULL DEFAULT now(),
  ator_handle   text NOT NULL,
  acao          text NOT NULL,
  recurso_tipo  text NOT NULL,
  recurso_id    text,
  detalhe       jsonb
);

CREATE INDEX idx_log_auditoria_recurso ON log_auditoria (recurso_tipo, recurso_id, ocorrido_em DESC);
CREATE INDEX idx_log_auditoria_ator ON log_auditoria (ator_handle, ocorrido_em DESC);
