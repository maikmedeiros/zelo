-- Dados de demonstração — passo 2.1 do PLANO.md.
--
-- NÃO É MIGRATION, e o lugar é este de propósito. `db/migrations/` roda sozinho no boot
-- (DB_AUTO_MIGRATE) em todo ambiente; dado de teste com senha conhecida não pode viajar
-- junto. Aqui é sob demanda: `npm run db:seed`.
--
-- O que este arquivo existe para permitir é o teste que sustenta o capítulo de resultados:
-- dois atores com sessões distintas pedindo a mesma postagem, um recebendo 200 e o outro
-- 404. Sem vínculo de turma no banco, o recorte de escopo não tem como ser exercido.
--
-- As três origens de escopo do modelo aparecem, uma por persona:
--   RESPONSAVEL_ALUNO → MATRICULA   → Bruno (pai do Théo, Turma A)
--   PROFESSOR_TURMA                 → Ana (titular da Turma A)
--   ACESSO_TURMA                    → Diana (coordenação, acesso à Turma A)
-- Mais os três controles negativos: Carla (vínculo só com a Turma B), Elias (sem vínculo
-- nenhum) e Fábio (sem perfil nenhum). Elias é o caso mais importante — ele TEM a
-- capability `VIEW:POST`, então uma falha de escopo aparece como 200 indevido, não como
-- 403. O Fábio é o oposto: sem capability, é ele quem exercita o 403 de qualquer rota.
--
-- Idempotente: UUIDs fixos e ON CONFLICT DO NOTHING em tudo. Pode rodar quantas vezes
-- quiser sem duplicar linha.
--
-- Senha de todas as personas: `zelo123`.

BEGIN;

-- =============================================================================
-- ANO LETIVO E TURMAS
-- =============================================================================
-- A escola padrão (`ZELO`) e o usuário `admin` vêm da migration 004.

INSERT INTO ano_letivo (id, escola_id, ano, data_inicio, data_fim) VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    2026, DATE '2026-02-02', DATE '2026-12-18'
  )
ON CONFLICT (id) DO NOTHING;

-- Duas turmas, porque uma só não prova isolamento: com uma turma, "ver tudo" e "ver o que
-- é meu" produzem o mesmo resultado.
INSERT INTO turma (id, escola_id, ano_letivo_id, nome, segmento, turno) VALUES
  (
    '22222222-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Maternal I A', 'Educação Infantil', 'MANHA'
  ),
  (
    '22222222-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Maternal II B', 'Educação Infantil', 'TARDE'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PESSOAS
-- =============================================================================
-- Crianças são PESSOA sem USUARIO: quem tem login é o adulto.

INSERT INTO pessoa (id, escola_id, nome, data_nascimento, email_contato) VALUES
  ('33333333-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ana Ribeiro',      DATE '1990-04-11', 'ana@zelo.test'),
  ('33333333-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bruno Carvalho',   DATE '1988-09-23', 'bruno@zelo.test'),
  ('33333333-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Carla Duarte',     DATE '1991-01-30', 'carla@zelo.test'),
  ('33333333-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Diana Esteves',    DATE '1983-07-05', 'diana@zelo.test'),
  ('33333333-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Elias Faria',      DATE '1986-11-17', 'elias@zelo.test'),
  ('33333333-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Théo Carvalho',    DATE '2023-03-08', NULL),
  ('33333333-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Lívia Duarte',     DATE '2022-06-19', NULL),
  ('33333333-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Fábio Gomes',      DATE '1994-02-14', 'fabio@zelo.test')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- USUÁRIOS
-- =============================================================================
-- Hash argon2id de `zelo123`, gerado pelo próprio `hashPassword` do projeto — um salt por
-- usuário, como o algoritmo faz em produção.

INSERT INTO usuario (id, pessoa_id, email, senha_hash, email_verificado) VALUES
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'ana@zelo.test',   '$argon2id$v=19$m=19456,t=2,p=1$/z6NxybfOKRy1TptCG78BQ$GHB3qYiQrPlFpQJrxspMcp+Jq1k2nF3wjWnhCek6Kbo', true),
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'bruno@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$Tu4+RLi8XrGFyLwVHwL8Gw$PXHunRdhPN8aPpnemqRcFfTkJqNIeycTTJWLH+Py4Ow', true),
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003', 'carla@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$IitdNDwqNbBGeP+P7JGrZg$tm9ZtmRDbZyYWuhPlbSu+UpzvoQsAQrWgbVvcj810Cc', true),
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000004', 'diana@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$8JOZye8uxdTk+xL30RoXjQ$0ZtNzjv4InwuJdE/1zMY3gbS3rpg8oSo/MU1ZeffXXw', true),
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000005', 'elias@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$2HDHI2bpbcybMmhzB6v1tA$b+QVfUWNC7DTpapLoTSiUkK1LmgyfgmuU2mN1Y90zsI', true),
  -- Sem linha em USUARIO_PERFIL de propósito: loga, mas não tem capability nenhuma.
  ('44444444-0000-0000-0000-000000000008', '33333333-0000-0000-0000-000000000008', 'fabio@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$IauyeR3mjQZzuErJdjitBg$jH8lD3AvhSjz8jrxKcYBohAeOo56os2XG9K/tRzYh8w', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PAPÉIS
-- =============================================================================

INSERT INTO aluno (id, pessoa_id, codigo) VALUES
  ('55555555-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000006', 'AL-2026-001'),
  ('55555555-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000007', 'AL-2026-002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO responsavel (id, pessoa_id) VALUES
  ('56666666-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002'),
  ('56666666-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003'),
  ('56666666-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

INSERT INTO professor (id, pessoa_id, registro, formacao) VALUES
  ('57777777-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'PROF-0417', 'Pedagogia')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VÍNCULOS — as três origens de escopo
-- =============================================================================

INSERT INTO matricula (id, aluno_id, turma_id, data_inicio) VALUES
  ('58888888-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000006', '22222222-0000-0000-0000-00000000000a', DATE '2026-02-02'),
  ('58888888-0000-0000-0000-000000000007', '55555555-0000-0000-0000-000000000007', '22222222-0000-0000-0000-00000000000b', DATE '2026-02-02')
ON CONFLICT (id) DO NOTHING;

-- Origem 1 — responsável: o escopo chega por RESPONSAVEL_ALUNO → MATRICULA. Elias não
-- aparece aqui: é responsável cadastrado, sem filho matriculado.
INSERT INTO responsavel_aluno (id, responsavel_id, aluno_id, parentesco, pode_consentir, financeiro) VALUES
  ('59999999-0000-0000-0000-000000000002', '56666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000006', 'PAI', true, true),
  ('59999999-0000-0000-0000-000000000003', '56666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000007', 'MAE', true, true)
ON CONFLICT (id) DO NOTHING;

-- Origem 2 — professor.
INSERT INTO professor_turma (id, professor_id, turma_id, funcao, data_inicio) VALUES
  ('5aaaaaaa-0000-0000-0000-000000000001', '57777777-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000a', 'TITULAR', DATE '2026-02-02')
ON CONFLICT (id) DO NOTHING;

-- Origem 3 — acesso concedido: Diana coordena a Turma A sem ser professora dela. É o
-- caminho que o modelo usa para direção e secretaria, e o que impede o cargo de virar
-- atalho para ver a escola inteira.
INSERT INTO acesso_turma (id, usuario_id, turma_id, motivo, concedido_por, justificativa, data_inicio) VALUES
  (
    '5bbbbbbb-0000-0000-0000-000000000004',
    '44444444-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-00000000000a',
    'COORDENACAO',
    '00000000-0000-0000-0000-000000000003',
    'Coordenação pedagógica do Maternal I A em 2026.',
    DATE '2026-02-02'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PERFIS DE DEMONSTRAÇÃO
-- =============================================================================
-- Perfis de ESCOLA (`escola_id` preenchido, `sistema = false`), não perfis de sistema. A
-- Fase 3b vai criar os definitivos com `escola_id NULL`, e o índice único é
-- (escola_id, codigo) NULLS NOT DISTINCT — então os dois conjuntos convivem sem colidir e
-- estes aqui podem ser jogados fora sem tocar naqueles.
--
-- As concessões seguem a regra do modelo: conteúdo de turma é abrangência TURMA para todo
-- perfil, inclusive coordenação; ESCOLA fica reservada a cadastro e configuração.

INSERT INTO perfil (id, escola_id, codigo, nome, descricao, sistema) VALUES
  ('66666666-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PROFESSOR',   'Professor',   'Publica e modera o conteúdo das turmas em que leciona.', false),
  ('66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'RESPONSAVEL', 'Responsável', 'Acompanha o conteúdo das turmas dos filhos.',            false),
  ('66666666-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'COORDENACAO', 'Coordenação', 'Conteúdo por turma; cadastro e acessos por escola.',     false)
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE concessao_demo (perfil text, codigo text, escopo abrangencia) ON COMMIT DROP;

INSERT INTO concessao_demo (perfil, codigo, escopo) VALUES
  -- RESPONSÁVEL — lê o conteúdo da turma do filho, interage, e consente pelo filho.
  ('RESPONSAVEL', 'VIEW:POST',           'TURMA'),
  ('RESPONSAVEL', 'VIEW:MEDIA',          'TURMA'),
  ('RESPONSAVEL', 'VIEW:COMMENT',        'TURMA'),
  ('RESPONSAVEL', 'CREATE:COMMENT',      'TURMA'),
  ('RESPONSAVEL', 'DELETE:COMMENT',      'PROPRIA'),
  ('RESPONSAVEL', 'VIEW:REACTION',       'TURMA'),
  ('RESPONSAVEL', 'CREATE:REACTION',     'TURMA'),
  ('RESPONSAVEL', 'DELETE:REACTION',     'PROPRIA'),
  ('RESPONSAVEL', 'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('RESPONSAVEL', 'VIEW:REPORT',         'TURMA'),
  ('RESPONSAVEL', 'VIEW:STUDENT',        'TURMA'),
  ('RESPONSAVEL', 'VIEW:CLASS',          'TURMA'),
  ('RESPONSAVEL', 'VIEW:CONSENT',        'TURMA'),
  ('RESPONSAVEL', 'CREATE:CONSENT',      'TURMA'),
  ('RESPONSAVEL', 'REVOKE:CONSENT',      'TURMA'),

  -- PROFESSOR — tudo do responsável, mais autoria e moderação, sempre limitado à turma.
  ('PROFESSOR',   'VIEW:POST',           'TURMA'),
  ('PROFESSOR',   'CREATE:POST',         'TURMA'),
  ('PROFESSOR',   'UPDATE:POST',         'TURMA'),
  ('PROFESSOR',   'DELETE:POST',         'TURMA'),
  ('PROFESSOR',   'PUBLISH:POST',        'TURMA'),
  ('PROFESSOR',   'VIEW:MEDIA',          'TURMA'),
  ('PROFESSOR',   'CREATE:MEDIA',        'TURMA'),
  ('PROFESSOR',   'DELETE:MEDIA',        'TURMA'),
  ('PROFESSOR',   'VIEW:COMMENT',        'TURMA'),
  ('PROFESSOR',   'CREATE:COMMENT',      'TURMA'),
  ('PROFESSOR',   'DELETE:COMMENT',      'TURMA'),
  ('PROFESSOR',   'VIEW:REACTION',       'TURMA'),
  ('PROFESSOR',   'CREATE:REACTION',     'TURMA'),
  ('PROFESSOR',   'DELETE:REACTION',     'PROPRIA'),
  ('PROFESSOR',   'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('PROFESSOR',   'VIEW:REPORT',         'TURMA'),
  ('PROFESSOR',   'CREATE:REPORT',       'TURMA'),
  ('PROFESSOR',   'UPDATE:REPORT',       'TURMA'),
  ('PROFESSOR',   'PUBLISH:REPORT',      'TURMA'),
  ('PROFESSOR',   'VIEW:STUDENT',        'TURMA'),
  ('PROFESSOR',   'VIEW:CLASS',          'TURMA'),
  ('PROFESSOR',   'VIEW:ENROLLMENT',     'TURMA'),
  ('PROFESSOR',   'VIEW:GUARDIAN',       'TURMA'),
  ('PROFESSOR',   'VIEW:GUARDIAN_LINK',  'TURMA'),
  ('PROFESSOR',   'VIEW:CONSENT',        'TURMA'),

  -- COORDENAÇÃO — o mesmo conteúdo por TURMA (o cargo não abre atalho), mais o cadastro e
  -- a gestão de acessos, que são configuração e por isso podem ser ESCOLA.
  ('COORDENACAO', 'VIEW:POST',           'TURMA'),
  ('COORDENACAO', 'CREATE:POST',         'TURMA'),
  ('COORDENACAO', 'UPDATE:POST',         'TURMA'),
  ('COORDENACAO', 'DELETE:POST',         'TURMA'),
  ('COORDENACAO', 'PUBLISH:POST',        'TURMA'),
  ('COORDENACAO', 'VIEW:MEDIA',          'TURMA'),
  ('COORDENACAO', 'VIEW:COMMENT',        'TURMA'),
  ('COORDENACAO', 'DELETE:COMMENT',      'TURMA'),
  ('COORDENACAO', 'VIEW:REACTION',       'TURMA'),
  ('COORDENACAO', 'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('COORDENACAO', 'VIEW:REPORT',         'TURMA'),
  ('COORDENACAO', 'PUBLISH:REPORT',      'TURMA'),
  ('COORDENACAO', 'VIEW:CONSENT',        'TURMA'),
  ('COORDENACAO', 'VIEW:CLASS_ACCESS',   'ESCOLA'),
  ('COORDENACAO', 'CREATE:CLASS_ACCESS', 'ESCOLA'),
  ('COORDENACAO', 'REVOKE:CLASS_ACCESS', 'ESCOLA'),
  ('COORDENACAO', 'VIEW:CLASS',          'ESCOLA'),
  ('COORDENACAO', 'VIEW:SCHOOL_YEAR',    'ESCOLA'),
  ('COORDENACAO', 'VIEW:PERSON',         'ESCOLA'),
  ('COORDENACAO', 'VIEW:STUDENT',        'ESCOLA'),
  ('COORDENACAO', 'VIEW:GUARDIAN',       'ESCOLA'),
  ('COORDENACAO', 'VIEW:GUARDIAN_LINK',  'ESCOLA'),
  ('COORDENACAO', 'VIEW:TEACHER',        'ESCOLA'),
  ('COORDENACAO', 'VIEW:TEACHER_LINK',   'ESCOLA'),
  ('COORDENACAO', 'VIEW:ENROLLMENT',     'ESCOLA');

-- Um JOIN silencioso descartaria capability escrita errada e o perfil nasceria mudo — o
-- 403 inexplicável que o PLANO.md lista como risco. Falhar aqui é barato; em produção não.
DO $$
DECLARE
  ausentes text;
BEGIN
  SELECT string_agg(DISTINCT c.codigo, ', ' ORDER BY c.codigo)
    INTO ausentes
  FROM concessao_demo c
  LEFT JOIN permissao p ON p.codigo = c.codigo
  WHERE p.id IS NULL;

  IF ausentes IS NOT NULL THEN
    RAISE EXCEPTION 'Capability inexistente em PERMISSAO: %', ausentes;
  END IF;
END
$$;

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_demo c
INNER JOIN perfil f
  ON f.codigo = c.perfil AND f.escola_id = '00000000-0000-0000-0000-000000000001'
INNER JOIN permissao p ON p.codigo = c.codigo
ON CONFLICT (perfil_id, permissao_id) DO NOTHING;

-- Elias recebe RESPONSAVEL de propósito: ele passa no `canRequest(VIEW:POST)` e mesmo assim
-- não pode enxergar postagem nenhuma. É o que separa "faltou permissão" (403) de "o escopo
-- funcionou" (404) no teste.
INSERT INTO usuario_perfil (id, usuario_id, perfil_id, concedido_por, data_inicio) VALUES
  ('67777777-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', DATE '2026-02-02'),
  ('67777777-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', DATE '2026-02-02'),
  ('67777777-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', '66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', DATE '2026-02-02'),
  ('67777777-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', '66666666-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', DATE '2026-02-02'),
  ('67777777-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000005', '66666666-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', DATE '2026-02-02')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CONSENTIMENTO
-- =============================================================================
-- Série temporal, não booleano: `vigencia_fim NULL` é a linha vigente.

INSERT INTO consentimento (id, aluno_id, tipo, concedido, registrado_por, responsavel_id, origem, vigencia_inicio) VALUES
  (
    '68888888-0000-0000-0000-000000000006',
    '55555555-0000-0000-0000-000000000006', 'IMAGEM_INTERNA', true,
    '44444444-0000-0000-0000-000000000002', '56666666-0000-0000-0000-000000000002',
    'TERMO_MATRICULA', TIMESTAMPTZ '2026-02-02 09:00:00-03'
  ),
  (
    '68888888-0000-0000-0000-000000000007',
    '55555555-0000-0000-0000-000000000007', 'IMAGEM_INTERNA', false,
    '44444444-0000-0000-0000-000000000003', '56666666-0000-0000-0000-000000000003',
    'PORTAL_RESPONSAVEL', TIMESTAMPTZ '2026-02-03 14:30:00-03'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- CONTEÚDO
-- =============================================================================

INSERT INTO postagem (id, turma_id, autor_id, tipo, status, titulo, corpo, referente_a, publicado_em) VALUES
  (
    '77777777-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    'REGISTRO_DIARIO', 'PUBLICADA',
    'Roda de leitura da manhã',
    'Hoje lemos "O Grúfalo" na roda. O Théo escolheu o livro e virou as páginas sozinho.',
    DATE '2026-08-27', TIMESTAMPTZ '2026-08-27 11:20:00-03'
  ),
  -- Turma B, para provar que a lista da Turma A não a inclui. Autoria da escola: a Ana só
  -- leciona na Turma A e não teria como publicar aqui.
  (
    '77777777-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-000000000003',
    'RECADO', 'PUBLICADA',
    'Reunião de pais do Maternal II B',
    'A reunião acontece no dia 10/09, às 18h, no auditório.',
    DATE '2026-08-26', TIMESTAMPTZ '2026-08-26 16:00:00-03'
  ),
  -- Rascunho na Turma A: o feed do responsável não pode trazê-lo, mesmo ele tendo escopo
  -- sobre a turma. Separa o filtro de escopo do filtro de status.
  (
    '77777777-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    'EVENTO', 'RASCUNHO',
    'Festa junina — rascunho',
    'Ainda organizando a lista de barracas.',
    DATE '2026-08-28', NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO postagem_aluno (id, postagem_id, aluno_id) VALUES
  ('78888888-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000006')
ON CONFLICT (id) DO NOTHING;

INSERT INTO postagem_comentario (id, postagem_id, autor_id, corpo, status) VALUES
  (
    '79999999-0000-0000-0000-000000000001',
    '77777777-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000002',
    'Que delícia! Ele pediu o mesmo livro em casa ontem.',
    'PUBLICADO'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO postagem_reacao (id, postagem_id, usuario_id, reacao_id)
SELECT
  '7aaaaaaa-0000-0000-0000-000000000001',
  '77777777-0000-0000-0000-000000000001',
  '44444444-0000-0000-0000-000000000002',
  r.id
FROM reacao r
WHERE r.codigo = 'CORACAO'
ON CONFLICT (id) DO NOTHING;

COMMIT;
