-- Zelo — esquema v2, gerado a partir de zelo_v2_2.dbml.
--
-- Política de exclusão das FKs. O DBML não declara ON DELETE; a regra abaixo é a decisão
-- deste arquivo e vale para toda chave estrangeira daqui pra baixo:
--   CASCADE  — a linha só existe por causa da outra e não é prova de nada (login, sessão,
--              token, vínculo de papel, item de postagem / relatório / notificação).
--   RESTRICT — apagar destruiria histórico ou evidência (escola, ano letivo, turma, aluno,
--              consentimento, autoria, comprovante de entrega).
--   SET NULL — autoria administrativa opcional (concedido_por, revogado_por,
--              confirmado_por): o registro sobrevive a quem o operou.

CREATE EXTENSION IF NOT EXISTS citext;

-- gen_random_uuid() é do core desde o PostgreSQL 13 — pgcrypto não é mais necessário.

-- Mantém atualizado_em coerente sem depender de disciplina da aplicação: uma coluna que
-- só é escrita quando alguém lembra mente mais do que informa.
CREATE FUNCTION set_atualizado_em() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- TIPOS ENUMERADOS
-- =============================================================================

CREATE TYPE turno_turma AS ENUM ('MANHA', 'TARDE', 'INTEGRAL');

CREATE TYPE parentesco AS ENUM ('MAE', 'PAI', 'AVO', 'TIO', 'IRMAO', 'TUTOR_LEGAL', 'OUTRO');

CREATE TYPE funcao_professor AS ENUM ('TITULAR', 'AUXILIAR', 'VOLANTE');

CREATE TYPE abrangencia AS ENUM ('PROPRIA', 'TURMA', 'ESCOLA');

CREATE TYPE ambiente_token AS ENUM ('DESENVOLVIMENTO', 'HOMOLOGACAO', 'PRODUCAO');

CREATE TYPE motivo_acesso_turma AS ENUM (
  'COORDENACAO', 'DIRECAO', 'SECRETARIA', 'SUBSTITUICAO', 'ESTAGIO', 'OUTRO'
);

CREATE TYPE tipo_consentimento AS ENUM (
  'IMAGEM_INTERNA', 'IMAGEM_EXTERNA', 'TRATAMENTO_BIOMETRICO'
);

CREATE TYPE origem_consentimento AS ENUM (
  'TERMO_MATRICULA', 'PORTAL_RESPONSAVEL', 'IMPORTACAO', 'SOLICITACAO_VERBAL'
);

CREATE TYPE tipo_postagem AS ENUM ('REGISTRO_DIARIO', 'RECADO', 'EVENTO');

CREATE TYPE status_postagem AS ENUM ('RASCUNHO', 'PUBLICADA', 'REMOVIDA');

CREATE TYPE status_processamento AS ENUM ('PENDENTE', 'PROCESSANDO', 'PROCESSADA', 'ERRO');

CREATE TYPE finalidade_variante AS ENUM ('THUMBNAIL', 'PROTEGIDA', 'INTEGRAL');

CREATE TYPE tipo_notificacao AS ENUM (
  'POSTAGEM_PUBLICADA', 'RELATORIO_PUBLICADO', 'CONSENTIMENTO_ALTERADO', 'COMUNICADO_ESCOLA'
);

CREATE TYPE canal_notificacao AS ENUM ('EMAIL', 'PUSH', 'IN_APP');

CREATE TYPE status_envio AS ENUM (
  'PENDENTE', 'ENVIANDO', 'ENVIADO', 'ENTREGUE', 'FALHA', 'CANCELADO'
);

CREATE TYPE dimensao_adaptacao AS ENUM (
  'ACOLHIMENTO', 'ALIMENTACAO', 'SONO', 'SOCIALIZACAO',
  'AUTONOMIA', 'LINGUAGEM', 'DESENVOLVIMENTO_MOTOR'
);

CREATE TYPE nivel_adaptacao AS ENUM (
  'NAO_OBSERVADO', 'EM_INICIO', 'EM_DESENVOLVIMENTO', 'CONSOLIDADO'
);

CREATE TYPE status_relatorio AS ENUM ('RASCUNHO', 'PUBLICADO');

-- =============================================================================
-- 1. PESSOA, LOGIN E CONTROLE DE ACESSO
-- =============================================================================

CREATE TABLE escola (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text NOT NULL,
  cnpj          varchar(14) UNIQUE,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escola_cnpj_digitos CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$')
);

CREATE TABLE pessoa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  nome            text NOT NULL,
  nome_social     text,
  data_nascimento date,
  cpf             varchar(11),
  telefone        varchar(20),
  email_contato   citext,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pessoa_cpf_digitos CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$')
);

-- CPF ausente não colide com CPF ausente: NULL é distinto de NULL por padrão, que é
-- exatamente o desejado aqui (criança sem CPF cadastrado é a regra, não a exceção).
CREATE UNIQUE INDEX uq_pessoa_cpf ON pessoa (escola_id, cpf);
CREATE INDEX idx_pessoa_escola ON pessoa (escola_id);

CREATE TABLE usuario (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id        uuid NOT NULL UNIQUE REFERENCES pessoa (id) ON DELETE CASCADE,
  email            citext NOT NULL,
  senha_hash       text NOT NULL,
  ativo            boolean NOT NULL DEFAULT true,
  email_verificado boolean NOT NULL DEFAULT false,
  ultimo_acesso_em timestamptz,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_usuario_email ON usuario (email);

CREATE TABLE sessao (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  token_hash          char(64) NOT NULL,
  ip                  inet,
  user_agent          text,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  ultima_atividade_em timestamptz NOT NULL DEFAULT now(),
  expira_em           timestamptz NOT NULL,
  expira_absoluto_em  timestamptz NOT NULL,
  CONSTRAINT sessao_teto_rigido CHECK (expira_absoluto_em >= expira_em)
);

CREATE UNIQUE INDEX uq_sessao_token ON sessao (token_hash);
CREATE INDEX idx_sessao_usuario ON sessao (usuario_id);
CREATE INDEX idx_sessao_expira ON sessao (expira_em);

CREATE TABLE api_token (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  nome          text NOT NULL,
  prefixo       varchar(12) NOT NULL,
  token_hash    char(64) NOT NULL,
  ambiente      ambiente_token NOT NULL DEFAULT 'DESENVOLVIMENTO',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  expira_em     timestamptz NOT NULL,
  ultimo_uso_em timestamptz,
  ultimo_uso_ip inet,
  revogado_em   timestamptz,
  revogado_por  uuid REFERENCES usuario (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_api_token_hash ON api_token (token_hash);
CREATE INDEX idx_api_token_usuario ON api_token (usuario_id);
CREATE INDEX idx_api_token_prefixo ON api_token (prefixo);

CREATE TABLE perfil (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     uuid REFERENCES escola (id) ON DELETE RESTRICT,
  codigo        varchar(40) NOT NULL,
  nome          text NOT NULL,
  descricao     text,
  sistema       boolean NOT NULL DEFAULT false,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- NULLS NOT DISTINCT é obrigatório aqui: escola_id NULL marca perfil de sistema, e sem
-- isso dois perfis de sistema com o mesmo código conviveriam (NULL nunca colide com NULL).
CREATE UNIQUE INDEX uq_perfil_codigo ON perfil (escola_id, codigo) NULLS NOT DISTINCT;

CREATE TABLE usuario_perfil (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  perfil_id     uuid NOT NULL REFERENCES perfil (id) ON DELETE RESTRICT,
  concedido_por uuid REFERENCES usuario (id) ON DELETE SET NULL,
  data_inicio   date NOT NULL DEFAULT CURRENT_DATE,
  data_fim      date,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuario_perfil_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX uq_usuario_perfil_ativo ON usuario_perfil (usuario_id, perfil_id)
  WHERE data_fim IS NULL;

CREATE TABLE permissao (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo    varchar(60) NOT NULL UNIQUE,
  acao      varchar(20) NOT NULL,
  recurso   varchar(40) NOT NULL,
  descricao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_permissao_recurso_acao ON permissao (recurso, acao);

CREATE TABLE perfil_permissao (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id    uuid NOT NULL REFERENCES perfil (id) ON DELETE CASCADE,
  permissao_id uuid NOT NULL REFERENCES permissao (id) ON DELETE RESTRICT,
  abrangencia  abrangencia NOT NULL DEFAULT 'PROPRIA',
  criado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_perfil_permissao ON perfil_permissao (perfil_id, permissao_id);

-- =============================================================================
-- 2. ESTRUTURA ESCOLAR
-- =============================================================================

CREATE TABLE ano_letivo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id   uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  ano         smallint NOT NULL,
  data_inicio date NOT NULL,
  data_fim    date NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ano_letivo_periodo CHECK (data_fim > data_inicio)
);

CREATE UNIQUE INDEX uq_ano_letivo ON ano_letivo (escola_id, ano);

CREATE TABLE turma (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  ano_letivo_id uuid NOT NULL REFERENCES ano_letivo (id) ON DELETE RESTRICT,
  nome          text NOT NULL,
  segmento      text NOT NULL,
  turno         turno_turma NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_turma ON turma (ano_letivo_id, nome, turno);

-- =============================================================================
-- 3. PAPÉIS
-- =============================================================================

CREATE TABLE aluno (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id     uuid NOT NULL UNIQUE REFERENCES pessoa (id) ON DELETE CASCADE,
  codigo        varchar(20),
  observacoes   text,
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE responsavel (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id     uuid NOT NULL UNIQUE REFERENCES pessoa (id) ON DELETE CASCADE,
  receber_email boolean NOT NULL DEFAULT true,
  receber_push  boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE responsavel_aluno (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id uuid NOT NULL REFERENCES responsavel (id) ON DELETE CASCADE,
  aluno_id       uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  parentesco     parentesco NOT NULL,
  pode_consentir boolean NOT NULL DEFAULT false,
  financeiro     boolean NOT NULL DEFAULT false,
  data_inicio    date NOT NULL DEFAULT CURRENT_DATE,
  data_fim       date,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT responsavel_aluno_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX uq_responsavel_aluno_ativo ON responsavel_aluno (responsavel_id, aluno_id)
  WHERE data_fim IS NULL;
CREATE INDEX idx_responsavel_aluno_responsavel ON responsavel_aluno (responsavel_id);
CREATE INDEX idx_responsavel_aluno_aluno ON responsavel_aluno (aluno_id);

CREATE TABLE professor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id     uuid NOT NULL UNIQUE REFERENCES pessoa (id) ON DELETE CASCADE,
  registro      varchar(30),
  formacao      text,
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE professor_turma (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES professor (id) ON DELETE CASCADE,
  turma_id     uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  funcao       funcao_professor NOT NULL DEFAULT 'TITULAR',
  data_inicio  date NOT NULL DEFAULT CURRENT_DATE,
  data_fim     date,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professor_turma_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX uq_professor_turma_ativo ON professor_turma (professor_id, turma_id)
  WHERE data_fim IS NULL;
CREATE INDEX idx_professor_turma_turma ON professor_turma (turma_id);

CREATE TABLE acesso_turma (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  turma_id      uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  motivo        motivo_acesso_turma NOT NULL,
  concedido_por uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  justificativa text,
  data_inicio   date NOT NULL DEFAULT CURRENT_DATE,
  data_fim      date,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acesso_turma_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX uq_acesso_turma_ativo ON acesso_turma (usuario_id, turma_id)
  WHERE data_fim IS NULL;
CREATE INDEX idx_acesso_turma_turma ON acesso_turma (turma_id);
CREATE INDEX idx_acesso_turma_usuario ON acesso_turma (usuario_id);

CREATE TABLE matricula (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id    uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  turma_id    uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim    date,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matricula_vigencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE UNIQUE INDEX uq_matricula_ativa ON matricula (aluno_id, turma_id)
  WHERE data_fim IS NULL;
CREATE INDEX idx_matricula_turma ON matricula (turma_id);
CREATE INDEX idx_matricula_aluno ON matricula (aluno_id);

-- =============================================================================
-- 4. CONSENTIMENTO
-- =============================================================================

-- RESTRICT em aluno_id, registrado_por e responsavel_id é deliberado: o consentimento é
-- prova de base legal (LGPD art. 14). Apagar a pessoa por trás dele passa a exigir apagar
-- o registro antes, de forma explícita — nunca por efeito colateral de um DELETE distante.
CREATE TABLE consentimento (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid NOT NULL REFERENCES aluno (id) ON DELETE RESTRICT,
  tipo            tipo_consentimento NOT NULL,
  concedido       boolean NOT NULL,
  registrado_por  uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  responsavel_id  uuid REFERENCES responsavel (id) ON DELETE RESTRICT,
  origem          origem_consentimento NOT NULL,
  documento_chave text,
  observacao      text,
  vigencia_inicio timestamptz NOT NULL DEFAULT now(),
  vigencia_fim    timestamptz,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consentimento_vigencia
    CHECK (vigencia_fim IS NULL OR vigencia_fim > vigencia_inicio),
  CONSTRAINT consentimento_verbal_exige_documento
    CHECK (origem <> 'SOLICITACAO_VERBAL' OR documento_chave IS NOT NULL)
);

CREATE UNIQUE INDEX uq_consentimento_vigente ON consentimento (aluno_id, tipo)
  WHERE vigencia_fim IS NULL;
CREATE INDEX idx_consentimento_periodo ON consentimento (vigencia_inicio, vigencia_fim);

-- =============================================================================
-- 5. CONTEÚDO
-- =============================================================================

CREATE TABLE postagem (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id      uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  autor_id      uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  tipo          tipo_postagem NOT NULL DEFAULT 'REGISTRO_DIARIO',
  status        status_postagem NOT NULL DEFAULT 'RASCUNHO',
  titulo        text,
  corpo         text,
  referente_a   date NOT NULL DEFAULT CURRENT_DATE,
  publicado_em  timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT postagem_publicada_tem_data
    CHECK (status <> 'PUBLICADA' OR publicado_em IS NOT NULL)
);

CREATE INDEX idx_postagem_feed ON postagem (turma_id, publicado_em DESC)
  WHERE status = 'PUBLICADA';

CREATE TABLE postagem_aluno (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  aluno_id    uuid NOT NULL REFERENCES aluno (id) ON DELETE RESTRICT,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_postagem_aluno ON postagem_aluno (postagem_id, aluno_id);
CREATE INDEX idx_postagem_aluno_aluno ON postagem_aluno (aluno_id);

CREATE TABLE midia (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id        uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  chave_original     text NOT NULL,
  mime               text NOT NULL,
  bytes              bigint NOT NULL,
  largura            integer,
  altura             integer,
  ordem              smallint NOT NULL DEFAULT 0,
  status             status_processamento NOT NULL DEFAULT 'PENDENTE',
  erro_processamento text,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT midia_bytes_positivo CHECK (bytes > 0)
);

CREATE INDEX idx_midia_postagem ON midia (postagem_id, ordem);

CREATE TABLE midia_variante (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  midia_id      uuid NOT NULL REFERENCES midia (id) ON DELETE CASCADE,
  finalidade    finalidade_variante NOT NULL,
  chave         text NOT NULL,
  hash_politica text,
  bytes         bigint,
  gerado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_midia_variante ON midia_variante (midia_id, finalidade);

-- =============================================================================
-- 6. RELATÓRIO DE ADAPTAÇÃO
-- =============================================================================

CREATE TABLE relatorio_adaptacao (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id       uuid NOT NULL REFERENCES aluno (id) ON DELETE RESTRICT,
  turma_id       uuid NOT NULL REFERENCES turma (id) ON DELETE RESTRICT,
  autor_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  periodo_inicio date NOT NULL,
  periodo_fim    date NOT NULL,
  status         status_relatorio NOT NULL DEFAULT 'RASCUNHO',
  sintese        text,
  publicado_em   timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relatorio_periodo CHECK (periodo_fim >= periodo_inicio),
  CONSTRAINT relatorio_publicado_tem_data
    CHECK (status <> 'PUBLICADO' OR publicado_em IS NOT NULL)
);

CREATE INDEX idx_relatorio_aluno ON relatorio_adaptacao (aluno_id, periodo_inicio);

CREATE TABLE relatorio_item (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id uuid NOT NULL REFERENCES relatorio_adaptacao (id) ON DELETE CASCADE,
  dimensao     dimensao_adaptacao NOT NULL,
  nivel        nivel_adaptacao NOT NULL DEFAULT 'NAO_OBSERVADO',
  observacao   text
);

CREATE UNIQUE INDEX uq_relatorio_dimensao ON relatorio_item (relatorio_id, dimensao);

-- =============================================================================
-- 7. NOTIFICAÇÃO — padrão outbox
-- =============================================================================

CREATE TABLE notificacao (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id    uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  tipo         tipo_notificacao NOT NULL,
  postagem_id  uuid REFERENCES postagem (id) ON DELETE CASCADE,
  relatorio_id uuid REFERENCES relatorio_adaptacao (id) ON DELETE CASCADE,
  assunto      text NOT NULL,
  corpo_resumo text,
  criado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificacao_postagem ON notificacao (postagem_id);

-- RESTRICT em usuario_id: o destinatário é comprovante de entrega. O endereço fica
-- congelado na linha justamente para a auditoria sobreviver à troca de e-mail.
CREATE TABLE notificacao_destinatario (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacao_id       uuid NOT NULL REFERENCES notificacao (id) ON DELETE CASCADE,
  usuario_id           uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  canal                canal_notificacao NOT NULL DEFAULT 'EMAIL',
  endereco             text NOT NULL,
  status               status_envio NOT NULL DEFAULT 'PENDENTE',
  tentativas           smallint NOT NULL DEFAULT 0,
  ultimo_erro          text,
  provedor_mensagem_id text,
  enviado_em           timestamptz,
  entregue_em          timestamptz,
  criado_em            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_notificacao_destinatario
  ON notificacao_destinatario (notificacao_id, usuario_id, canal);

-- O DBML pede índice parcial sobre `status`; a coluna indexada é `criado_em` porque dentro
-- do filtro todo mundo tem o mesmo status — o que o poller do outbox precisa é da ordem.
CREATE INDEX idx_envio_pendente ON notificacao_destinatario (criado_em)
  WHERE status = 'PENDENTE';

-- =============================================================================
-- 8. FASE 2 — VISÃO COMPUTACIONAL
-- =============================================================================

-- CASCADE a partir de aluno é intencional: dado biométrico não sobrevive à eliminação do
-- titular (LGPD art. 18, VI).
CREATE TABLE face_referencia (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id     uuid NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  chave_imagem text NOT NULL,
  embedding    bytea NOT NULL,
  modelo       text NOT NULL,
  dimensoes    smallint NOT NULL,
  ativo        boolean NOT NULL DEFAULT true,
  criado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_face_referencia_ativa ON face_referencia (aluno_id) WHERE ativo;

CREATE TABLE midia_face (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  midia_id           uuid NOT NULL REFERENCES midia (id) ON DELETE CASCADE,
  bbox_x             integer NOT NULL,
  bbox_y             integer NOT NULL,
  bbox_largura       integer NOT NULL,
  bbox_altura        integer NOT NULL,
  confianca_deteccao real NOT NULL,
  aluno_id           uuid REFERENCES aluno (id) ON DELETE SET NULL,
  similaridade       real,
  confirmado_por     uuid REFERENCES usuario (id) ON DELETE SET NULL,
  confirmado_em      timestamptz,
  criado_em          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_midia_face_midia ON midia_face (midia_id);

CREATE TABLE reprocessamento (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  midia_id         uuid NOT NULL REFERENCES midia (id) ON DELETE CASCADE,
  motivo           text NOT NULL,
  consentimento_id uuid REFERENCES consentimento (id) ON DELETE SET NULL,
  status           status_processamento NOT NULL DEFAULT 'PENDENTE',
  tentativas       smallint NOT NULL DEFAULT 0,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  concluido_em     timestamptz
);

CREATE INDEX idx_reprocessamento_pendente ON reprocessamento (criado_em)
  WHERE status = 'PENDENTE';

-- =============================================================================
-- TRIGGERS DE atualizado_em
-- =============================================================================

CREATE TRIGGER trg_escola_atualizado_em BEFORE UPDATE ON escola
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_pessoa_atualizado_em BEFORE UPDATE ON pessoa
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_usuario_atualizado_em BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_perfil_atualizado_em BEFORE UPDATE ON perfil
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_turma_atualizado_em BEFORE UPDATE ON turma
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_aluno_atualizado_em BEFORE UPDATE ON aluno
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_responsavel_atualizado_em BEFORE UPDATE ON responsavel
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_professor_atualizado_em BEFORE UPDATE ON professor
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_postagem_atualizado_em BEFORE UPDATE ON postagem
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
CREATE TRIGGER trg_relatorio_atualizado_em BEFORE UPDATE ON relatorio_adaptacao
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
