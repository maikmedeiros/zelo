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
-- Mais os quatro controles negativos:
--   Gabriel — pai de OUTRA criança da mesma Turma A. É ele quem prova que a postagem
--             endereçada a um aluno não vaza para os demais responsáveis da turma.
--   Carla   — vínculo só com a Turma B.
--   Elias   — sem vínculo nenhum. TEM a capability `VIEW:POST`, então uma falha de escopo
--             aparece como 200 indevido, não como 403.
--   Fábio   — sem perfil nenhum: é ele quem exercita o 403 de qualquer rota.
--
-- E, do outro extremo da régua, Isabel — ADMINISTRADOR. Ela existe porque o `admin` da
-- migration 004 é conta de bootstrap (login `admin`, sem formato de e-mail, senha `admin`) e
-- não serve de persona: quem demonstra o perfil mais amplo numa tela de login de verdade
-- precisa ter e-mail e a mesma senha das outras.
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

-- Os adultos têm CPF; as três crianças, não. Isso é a demonstração da regra da Fase 3: o
-- índice `uq_pessoa_cpf` só impede a pessoa duplicada quando o CPF está preenchido, e por
-- isso o CPF é exigido no papel adulto (`POST /guardians`, `POST /teachers`) e não em
-- `POST /people`. Os números abaixo têm dígito verificador válido — o `isValidCpf` os aceita.
INSERT INTO pessoa (id, escola_id, nome, data_nascimento, cpf, email_contato) VALUES
  ('33333333-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ana Ribeiro',      DATE '1990-04-11', '10111111102', 'ana@zelo.test'),
  ('33333333-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Bruno Carvalho',   DATE '1988-09-23', '10222222280', 'bruno@zelo.test'),
  ('33333333-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Carla Duarte',     DATE '1991-01-30', '10333333365', 'carla@zelo.test'),
  ('33333333-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Diana Esteves',    DATE '1983-07-05', '10444444440', 'diana@zelo.test'),
  ('33333333-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Elias Faria',      DATE '1986-11-17', '10555555526', 'elias@zelo.test'),
  ('33333333-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Théo Carvalho',    DATE '2023-03-08', NULL,          NULL),
  ('33333333-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Lívia Duarte',     DATE '2022-06-19', NULL,          NULL),
  ('33333333-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Fábio Gomes',      DATE '1994-02-14', '10666666601', 'fabio@zelo.test'),
  ('33333333-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Gabriel Nunes',    DATE '1989-05-02', '10777777797', 'gabriel@zelo.test'),
  ('33333333-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'Helena Nunes',     DATE '2023-01-27', NULL,          NULL),
  ('33333333-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', 'Isabel Prado',     DATE '1979-10-08', '10888888872', 'isabel@zelo.test')
ON CONFLICT (id) DO NOTHING;

-- Backfill: bancos que rodaram o seed antes de o CPF existir têm as linhas acima com
-- `cpf IS NULL`, e o `ON CONFLICT (id) DO NOTHING` não as tocaria.
UPDATE pessoa SET cpf = v.cpf
FROM (VALUES
  ('33333333-0000-0000-0000-000000000001'::uuid, '10111111102'),
  ('33333333-0000-0000-0000-000000000002'::uuid, '10222222280'),
  ('33333333-0000-0000-0000-000000000003'::uuid, '10333333365'),
  ('33333333-0000-0000-0000-000000000004'::uuid, '10444444440'),
  ('33333333-0000-0000-0000-000000000005'::uuid, '10555555526'),
  ('33333333-0000-0000-0000-000000000008'::uuid, '10666666601'),
  ('33333333-0000-0000-0000-000000000009'::uuid, '10777777797'),
  ('33333333-0000-0000-0000-00000000000b'::uuid, '10888888872')
) AS v(id, cpf)
WHERE pessoa.id = v.id AND pessoa.cpf IS NULL;

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
  ('44444444-0000-0000-0000-000000000008', '33333333-0000-0000-0000-000000000008', 'fabio@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$IauyeR3mjQZzuErJdjitBg$jH8lD3AvhSjz8jrxKcYBohAeOo56os2XG9K/tRzYh8w', true),
  ('44444444-0000-0000-0000-000000000009', '33333333-0000-0000-0000-000000000009', 'gabriel@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$2d3hWpRdWKTBGgoOAb5p3A$S1KMooYK1fVfv/6oE4hiyzadVBLctiTi6TB5TqFfVYQ', true),
  ('44444444-0000-0000-0000-00000000000b', '33333333-0000-0000-0000-00000000000b', 'isabel@zelo.test', '$argon2id$v=19$m=19456,t=2,p=1$zhjdLnKSWsbbrVWOiH1mcg$XrcP3EM9IwqUuMpmkzepDZsvoih0kWiHftzin6y/L9A', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PAPÉIS
-- =============================================================================

INSERT INTO aluno (id, pessoa_id, codigo) VALUES
  ('55555555-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000006', 'AL-2026-001'),
  ('55555555-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000007', 'AL-2026-002'),
  ('55555555-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a', 'AL-2026-003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO responsavel (id, pessoa_id) VALUES
  ('56666666-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002'),
  ('56666666-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000003'),
  ('56666666-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000005'),
  ('56666666-0000-0000-0000-000000000009', '33333333-0000-0000-0000-000000000009')
ON CONFLICT (id) DO NOTHING;

INSERT INTO professor (id, pessoa_id, registro, formacao) VALUES
  ('57777777-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'PROF-0417', 'Pedagogia')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- VÍNCULOS — as três origens de escopo
-- =============================================================================

INSERT INTO matricula (id, aluno_id, turma_id, data_inicio) VALUES
  ('58888888-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000006', '22222222-0000-0000-0000-00000000000a', DATE '2026-02-02'),
  ('58888888-0000-0000-0000-000000000007', '55555555-0000-0000-0000-000000000007', '22222222-0000-0000-0000-00000000000b', DATE '2026-02-02'),
  ('58888888-0000-0000-0000-00000000000a', '55555555-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-00000000000a', DATE '2026-02-02')
ON CONFLICT (id) DO NOTHING;

-- Origem 1 — responsável: o escopo chega por RESPONSAVEL_ALUNO → MATRICULA. Elias não
-- aparece aqui: é responsável cadastrado, sem filho matriculado.
INSERT INTO responsavel_aluno (id, responsavel_id, aluno_id, parentesco, pode_consentir, financeiro) VALUES
  ('59999999-0000-0000-0000-000000000002', '56666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000006', 'PAI', true, true),
  ('59999999-0000-0000-0000-000000000003', '56666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000007', 'MAE', true, true),
  ('59999999-0000-0000-0000-000000000009', '56666666-0000-0000-0000-000000000009', '55555555-0000-0000-0000-00000000000a', 'PAI', true, true)
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
-- CONCESSÃO DE PERFIS
-- =============================================================================
-- Os perfis não são criados aqui: `ADMINISTRADOR`, `COORDENACAO`, `PROFESSOR` e
-- `RESPONSAVEL` são perfis de sistema, provisionados pela migration `007` com uma cópia por
-- escola. O seed só distribui. Perfil de sistema tem `sistema = true` e a API recusa editá-lo,
-- então a matriz de concessões vive na migration, onde é versionada e conferida.
--
-- O `perfil_id` vem por consulta ao código, e não por UUID fixo: a migration gera o id, e
-- amarrar o seed a um valor literal quebraria em qualquer banco recriado.

-- Elias recebe RESPONSAVEL de propósito: ele passa no `canRequest(VIEW:POST)` e mesmo assim
-- não pode enxergar postagem nenhuma. É o que separa "faltou permissão" (403) de "o escopo
-- funcionou" (404) no teste. Fábio continua sem perfil nenhum — é ele quem exercita o 403.
INSERT INTO usuario_perfil (id, usuario_id, perfil_id, concedido_por, data_inicio)
SELECT v.id, v.usuario_id, f.id, '00000000-0000-0000-0000-000000000003', DATE '2026-02-02'
FROM (VALUES
  ('67777777-0000-0000-0000-000000000001'::uuid, '44444444-0000-0000-0000-000000000001'::uuid, 'PROFESSOR'),
  ('67777777-0000-0000-0000-000000000002'::uuid, '44444444-0000-0000-0000-000000000002'::uuid, 'RESPONSAVEL'),
  ('67777777-0000-0000-0000-000000000003'::uuid, '44444444-0000-0000-0000-000000000003'::uuid, 'RESPONSAVEL'),
  ('67777777-0000-0000-0000-000000000004'::uuid, '44444444-0000-0000-0000-000000000004'::uuid, 'COORDENACAO'),
  ('67777777-0000-0000-0000-000000000005'::uuid, '44444444-0000-0000-0000-000000000005'::uuid, 'RESPONSAVEL'),
  ('67777777-0000-0000-0000-000000000009'::uuid, '44444444-0000-0000-0000-000000000009'::uuid, 'RESPONSAVEL'),
  ('67777777-0000-0000-0000-00000000000b'::uuid, '44444444-0000-0000-0000-00000000000b'::uuid, 'ADMINISTRADOR')
) AS v(id, usuario_id, codigo)
INNER JOIN perfil f
  ON f.codigo = v.codigo AND f.escola_id = '00000000-0000-0000-0000-000000000001'
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

-- Seis postagens cobrindo os dois modos de destinatário. A audiência não mora mais na
-- postagem: `destinatario` diz qual tabela vale, e a outra fica vazia (o trigger
-- `postagem_audiencia_coerente` recusa a mistura).

INSERT INTO postagem (id, destinatario, autor_id, tipo, status, titulo, corpo, referente_a, publicado_em) VALUES
  (
    '77777777-0000-0000-0000-000000000001', 'TURMA',
    '44444444-0000-0000-0000-000000000001',
    'REGISTRO_DIARIO', 'PUBLICADA',
    'Roda de leitura da manhã',
    'Hoje lemos "O Grúfalo" na roda. As crianças escolheram o livro e viraram as páginas.',
    DATE '2026-08-27', TIMESTAMPTZ '2026-08-27 11:20:00-03'
  ),
  -- Turma B, para provar que a lista da Turma A não a inclui. Autoria da escola: a Ana só
  -- leciona na Turma A e não teria como publicar aqui.
  (
    '77777777-0000-0000-0000-000000000002', 'TURMA',
    '00000000-0000-0000-0000-000000000003',
    'RECADO', 'PUBLICADA',
    'Reunião de pais do Maternal II B',
    'A reunião acontece no dia 10/09, às 18h, no auditório.',
    DATE '2026-08-26', TIMESTAMPTZ '2026-08-26 16:00:00-03'
  ),
  -- Rascunho na Turma A: o feed do responsável não pode trazê-lo, mesmo ele tendo escopo
  -- sobre a turma. Separa o filtro de escopo do filtro de status.
  (
    '77777777-0000-0000-0000-000000000003', 'TURMA',
    '44444444-0000-0000-0000-000000000001',
    'EVENTO', 'RASCUNHO',
    'Festa junina — rascunho',
    'Ainda organizando a lista de barracas.',
    DATE '2026-08-28', NULL
  ),
  -- Modo ALUNO, um único aluno. É o teste de não-vazamento: o Gabriel é pai de outra
  -- criança da MESMA turma e não pode enxergar esta linha; a Ana e a Diana, sim, porque
  -- são equipe da turma onde o Théo está matriculado.
  (
    '77777777-0000-0000-0000-000000000004', 'ALUNO',
    '44444444-0000-0000-0000-000000000001',
    'REGISTRO_DIARIO', 'PUBLICADA',
    'O Théo dormiu bem hoje',
    'Dormiu 1h40 sem acordar e acordou tranquilo. Aceitou a fruta da tarde inteira.',
    DATE '2026-08-27', TIMESTAMPTZ '2026-08-27 15:05:00-03'
  ),
  -- Modo ALUNO com alunos de TURMAS DIFERENTES — o caso que a cardinalidade antiga não
  -- conseguia representar.
  (
    '77777777-0000-0000-0000-000000000005', 'ALUNO',
    '00000000-0000-0000-0000-000000000003',
    'EVENTO', 'PUBLICADA',
    'Fotos do passeio ao parque',
    'Seguem as fotos das crianças que participaram do passeio de quinta.',
    DATE '2026-08-25', TIMESTAMPTZ '2026-08-25 18:40:00-03'
  ),
  -- Modo TURMA com MAIS DE UMA turma — o outro caso novo.
  (
    '77777777-0000-0000-0000-000000000006', 'TURMA',
    '00000000-0000-0000-0000-000000000003',
    'RECADO', 'PUBLICADA',
    'Recesso de setembro',
    'Não haverá aula nos dias 7 e 8 de setembro. Voltamos na quarta.',
    DATE '2026-08-24', TIMESTAMPTZ '2026-08-24 09:00:00-03'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO postagem_turma (id, postagem_id, turma_id) VALUES
  ('78777777-0000-0000-0000-000000000001', '77777777-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000a'),
  ('78777777-0000-0000-0000-000000000002', '77777777-0000-0000-0000-000000000002', '22222222-0000-0000-0000-00000000000b'),
  ('78777777-0000-0000-0000-000000000003', '77777777-0000-0000-0000-000000000003', '22222222-0000-0000-0000-00000000000a'),
  ('78777777-0000-0000-0000-000000000061', '77777777-0000-0000-0000-000000000006', '22222222-0000-0000-0000-00000000000a'),
  ('78777777-0000-0000-0000-000000000062', '77777777-0000-0000-0000-000000000006', '22222222-0000-0000-0000-00000000000b')
ON CONFLICT (id) DO NOTHING;

-- `postagem_aluno` mudou de sentido na migration 005: era marcação de quem aparece, agora
-- é audiência. Só postagem de destinatário ALUNO tem linha aqui.
INSERT INTO postagem_aluno (id, postagem_id, aluno_id) VALUES
  ('78888888-0000-0000-0000-000000000004', '77777777-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000006'),
  ('78888888-0000-0000-0000-000000000051', '77777777-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000006'),
  ('78888888-0000-0000-0000-000000000052', '77777777-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000007')
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

-- =============================================================================
-- RELATÓRIO DE ADAPTAÇÃO
-- =============================================================================
-- Dois relatórios da Ana sobre crianças da Turma A: um PUBLICADO, que o Bruno enxerga, e um
-- RASCUNHO, que só a equipe da turma alcança. É o par que exercita a regra de visibilidade.

INSERT INTO relatorio
  (id, aluno_id, turma_id, autor_id, periodo_inicio, periodo_fim, status, sintese, publicado_em)
VALUES
  (
    '7bbbbbbb-0000-0000-0000-000000000001',
    '55555555-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    DATE '2026-02-02', DATE '2026-04-30', 'PUBLICADO',
    'O Théo chegou chorando na primeira semana e hoje entra sozinho. A separação deixou de ser o ponto difícil do dia.',
    TIMESTAMPTZ '2026-05-04 10:00:00-03'
  ),
  (
    '7bbbbbbb-0000-0000-0000-00000000000a',
    '55555555-0000-0000-0000-00000000000a',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    DATE '2026-05-01', DATE '2026-07-31', 'RASCUNHO',
    NULL, NULL
  )
ON CONFLICT (id) DO NOTHING;

-- As sete dimensões existem em todo relatório: quem não foi observada fica NAO_OBSERVADO, e é
-- isso que torna dois relatórios da mesma criança comparáveis no tempo.
INSERT INTO relatorio_item (relatorio_id, dimensao, nivel, observacao)
SELECT
  r.id,
  d.dimensao::dimensao_adaptacao,
  coalesce(v.nivel, 'NAO_OBSERVADO')::nivel_adaptacao,
  v.observacao
FROM relatorio r
CROSS JOIN unnest(ARRAY[
  'ACOLHIMENTO', 'ALIMENTACAO', 'SONO', 'SOCIALIZACAO',
  'AUTONOMIA', 'LINGUAGEM', 'DESENVOLVIMENTO_MOTOR'
]) AS d(dimensao)
LEFT JOIN (VALUES
  ('7bbbbbbb-0000-0000-0000-000000000001', 'ACOLHIMENTO',  'CONSOLIDADO',        'Entra sozinho e se despede na porta.'),
  ('7bbbbbbb-0000-0000-0000-000000000001', 'ALIMENTACAO',  'EM_DESENVOLVIMENTO', 'Aceita a fruta da tarde; recusa legume cozido.'),
  ('7bbbbbbb-0000-0000-0000-000000000001', 'SONO',         'CONSOLIDADO',        'Dorme o período todo sem colo.'),
  ('7bbbbbbb-0000-0000-0000-000000000001', 'SOCIALIZACAO', 'EM_DESENVOLVIMENTO', 'Brinca ao lado dos colegas, ainda pouca troca.'),
  ('7bbbbbbb-0000-0000-0000-000000000001', 'LINGUAGEM',    'EM_INICIO',          'Fala por palavra solta, aponta o que quer.')
) AS v(relatorio, dimensao, nivel, observacao)
  ON v.relatorio::uuid = r.id AND v.dimensao = d.dimensao
WHERE r.id IN (
  '7bbbbbbb-0000-0000-0000-000000000001',
  '7bbbbbbb-0000-0000-0000-00000000000a'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TEMPLATE DE PREENCHIMENTO
-- =============================================================================
-- Da escola, não da Ana: a Diana e qualquer outra professora usam o mesmo. `criado_por` é
-- autoria e chave de quem pode editar, nunca recorte de leitura.

INSERT INTO relatorio_template (id, escola_id, nome, descricao, sintese, criado_por) VALUES
  (
    '7ccccccc-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Adaptação — primeiro trimestre',
    'Texto de partida para o fechamento do primeiro trimestre do berçário.',
    'A criança concluiu o período de adaptação com o acolhimento estabelecido e a rotina da casa incorporada.',
    '44444444-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO relatorio_template_item (template_id, dimensao, nivel, observacao) VALUES
  ('7ccccccc-0000-0000-0000-000000000001', 'ACOLHIMENTO',  NULL, 'Chega à sala e se despede da família sem intercorrência.'),
  ('7ccccccc-0000-0000-0000-000000000001', 'ALIMENTACAO',  NULL, 'Aceita a refeição oferecida e experimenta alimento novo quando incentivada.'),
  ('7ccccccc-0000-0000-0000-000000000001', 'SONO',         NULL, 'Adormece no colchonete no horário da turma.'),
  ('7ccccccc-0000-0000-0000-000000000001', 'SOCIALIZACAO', NULL, 'Participa das brincadeiras coletivas e divide os brinquedos.'),
  ('7ccccccc-0000-0000-0000-000000000001', 'AUTONOMIA',    NULL, 'Guarda o próprio material com apoio verbal do adulto.')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- AGENDA
-- =============================================================================
-- O caderno de recados, por criança. Théo e Helena são os dois da Turma A com pais
-- diferentes — bruno e gabriel —, e é esse par que prova o recorte: cada pai enxerga só a
-- agenda do próprio filho, embora as crianças estejam na mesma sala.
--
-- A conversa do Théo tem os dois lados e um vínculo de resposta; a da Helena tem só a
-- professora. Bruno alcança 3 entradas, gabriel alcança 1.

INSERT INTO agenda_entrada
  (id, aluno_id, turma_id, autor_id, texto, data_referencia, criado_em)
VALUES
  (
    '7ddddddd-0000-0000-0000-000000000001',
    '55555555-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    'Bom dia, pais. O Théo não se alimentou bem hoje: recusou o almoço e comeu só a fruta da tarde. Nada de febre, mas fica o aviso.',
    DATE '2026-08-27',
    TIMESTAMPTZ '2026-08-27 17:20:00-03'
  ),
  (
    '7ddddddd-0000-0000-0000-000000000003',
    '55555555-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    'Bom dia, pais. A criança apresentou muita tosse ao longo do dia, principalmente depois do parque.',
    DATE '2026-08-28',
    TIMESTAMPTZ '2026-08-28 17:05:00-03'
  ),
  (
    '7ddddddd-0000-0000-0000-00000000000a',
    '55555555-0000-0000-0000-00000000000a',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000001',
    'Bom dia, pais. A Helena dormiu pouco no descanso e ficou mais irritada no fim da tarde.',
    DATE '2026-08-28',
    TIMESTAMPTZ '2026-08-28 17:10:00-03'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO agenda_entrada
  (id, aluno_id, turma_id, autor_id, responde_a_id, texto, data_referencia, criado_em)
VALUES
  (
    '7ddddddd-0000-0000-0000-000000000002',
    '55555555-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-00000000000a',
    '44444444-0000-0000-0000-000000000002',
    '7ddddddd-0000-0000-0000-000000000001',
    'Obrigado por avisar. Ele acordou reclamando de dor de barriga, deve ser isso. Amanhã mando a fruta que ele gosta.',
    DATE '2026-08-27',
    TIMESTAMPTZ '2026-08-27 20:40:00-03'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
