-- Catálogo de perfis de sistema — uma cópia por escola.
--
-- A dívida que a 004 deixou aberta. Até aqui existia um único perfil, `ADMINISTRADOR`, com as
-- 69 capabilities em `ESCOLA`: o perfil que **contorna** o isolamento por turma, criado para
-- destravar o desenvolvimento. Todo o resto do modelo de autorização — as três abrangências,
-- o recorte por turma, a guarda de escalada — nunca teve um perfil real para exercitá-lo.
--
-- Por que por escola, e não global. A `001` reservou `escola_id NULL` para o perfil de
-- sistema, e o índice `uq_perfil_codigo` é `NULLS NOT DISTINCT` justamente para isso. A
-- decisão foi outra: **cada escola recebe a sua cópia**, com `escola_id` preenchido. O motivo
-- é a Fase 6 — as políticas de RLS são todas ancoradas em `escola_id`, e uma linha com
-- `escola_id NULL` não pertence a escola nenhuma, o que a torna um caso especial em cada
-- política. Cópia por escola mantém o modelo uniforme: toda linha tem dono.
-- `escola_id NULL` fica sem uso; o índice continua correto e inofensivo.
--
-- `sistema = true` nas quatro. São **provisionadas por migration e não editáveis pela API** —
-- o `PATCH /roles/:roleId` recusa perfil de sistema, e é isso que garante que `PROFESSOR`
-- signifique a mesma coisa em toda escola. A escola que precisar de outra combinação cria um
-- perfil próprio pelo `POST /roles`, que é exatamente para isso e já passa pela guarda de
-- escalada de privilégio.
--
-- Idempotente e autoritativa: o `DO UPDATE` adota perfil que já exista com o mesmo código
-- (é o caso do `demo.sql`, que criou `PROFESSOR`, `RESPONSAVEL` e `COORDENACAO` como perfis
-- comuns antes desta migration), e o `DELETE` no fim remove concessão que tenha saído do
-- catálogo. Rodar de novo reconverge o estado.
--
-- TODO(escola): quando `POST /schools` existir, o cadastro de escola tem de replicar este
-- catálogo para a escola nova. Enquanto a escola é uma só, a fan-out abaixo dá conta.

-- As duas tabelas temporárias são descartadas no fim, e não com `ON COMMIT DROP`: o
-- migrator já envolve cada arquivo numa transação, mas aplicar este SQL direto no `psql`
-- roda em autocommit, e ali o `ON COMMIT DROP` apagaria a tabela antes do próximo INSERT.
CREATE TEMP TABLE perfil_sistema (codigo text, nome text, descricao text);

INSERT INTO perfil_sistema (codigo, nome, descricao) VALUES
  ('ADMINISTRADOR', 'Administrador', 'Acesso irrestrito. Uso interno.'),
  ('COORDENACAO',   'Coordenação',   'Cadastro e acessos por escola; conteúdo sempre por turma.'),
  ('PROFESSOR',     'Professor',     'Publica e modera o conteúdo das turmas em que leciona.'),
  ('RESPONSAVEL',   'Responsável',   'Acompanha e comenta o conteúdo das turmas dos filhos.');

-- A matriz. A regra que a governa: **conteúdo de turma é `TURMA` para todo perfil**, cargo
-- nenhum abre atalho; `ESCOLA` fica reservada a cadastro e configuração, que são operações
-- sobre a estrutura da escola e não sobre a vida das crianças.
--
-- O `ADMINISTRADOR` não aparece aqui: ele recebe o catálogo inteiro logo abaixo.
CREATE TEMP TABLE concessao_sistema (perfil text, codigo text, escopo abrangencia);

INSERT INTO concessao_sistema (perfil, codigo, escopo) VALUES
  -- RESPONSÁVEL — lê o conteúdo da turma do filho, interage e consente pelo filho.
  --
  -- Não tem `CREATE:POST`, e isso é decisão de produto, não esquecimento: a ferramenta é de
  -- comunicação da escola para a família. A família responde por comentário.
  ('RESPONSAVEL',   'VIEW:POST',           'TURMA'),
  ('RESPONSAVEL',   'VIEW:MEDIA',          'TURMA'),
  ('RESPONSAVEL',   'VIEW:COMMENT',        'TURMA'),
  ('RESPONSAVEL',   'CREATE:COMMENT',      'TURMA'),
  ('RESPONSAVEL',   'DELETE:COMMENT',      'PROPRIA'),
  ('RESPONSAVEL',   'VIEW:REACTION',       'TURMA'),
  ('RESPONSAVEL',   'CREATE:REACTION',     'TURMA'),
  ('RESPONSAVEL',   'DELETE:REACTION',     'PROPRIA'),
  ('RESPONSAVEL',   'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('RESPONSAVEL',   'VIEW:REPORT',         'TURMA'),
  ('RESPONSAVEL',   'VIEW:STUDENT',        'TURMA'),
  ('RESPONSAVEL',   'VIEW:CLASS',          'TURMA'),
  ('RESPONSAVEL',   'VIEW:CONSENT',        'TURMA'),
  ('RESPONSAVEL',   'CREATE:CONSENT',      'TURMA'),
  ('RESPONSAVEL',   'REVOKE:CONSENT',      'TURMA'),

  -- PROFESSOR — o do responsável, mais autoria e moderação, sempre limitado à turma. É o
  -- perfil que demonstra o isolamento: `TURMA` em tudo, sem uma única linha `ESCOLA` que não
  -- seja o catálogo de tipos de reação.
  ('PROFESSOR',     'VIEW:POST',           'TURMA'),
  ('PROFESSOR',     'CREATE:POST',         'TURMA'),
  ('PROFESSOR',     'UPDATE:POST',         'TURMA'),
  ('PROFESSOR',     'DELETE:POST',         'TURMA'),
  ('PROFESSOR',     'PUBLISH:POST',        'TURMA'),
  ('PROFESSOR',     'VIEW:MEDIA',          'TURMA'),
  ('PROFESSOR',     'CREATE:MEDIA',        'TURMA'),
  ('PROFESSOR',     'DELETE:MEDIA',        'TURMA'),
  ('PROFESSOR',     'VIEW:COMMENT',        'TURMA'),
  ('PROFESSOR',     'CREATE:COMMENT',      'TURMA'),
  ('PROFESSOR',     'DELETE:COMMENT',      'TURMA'),
  ('PROFESSOR',     'VIEW:REACTION',       'TURMA'),
  ('PROFESSOR',     'CREATE:REACTION',     'TURMA'),
  ('PROFESSOR',     'DELETE:REACTION',     'PROPRIA'),
  ('PROFESSOR',     'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('PROFESSOR',     'VIEW:REPORT',         'TURMA'),
  ('PROFESSOR',     'CREATE:REPORT',       'TURMA'),
  ('PROFESSOR',     'UPDATE:REPORT',       'TURMA'),
  ('PROFESSOR',     'PUBLISH:REPORT',      'TURMA'),
  ('PROFESSOR',     'VIEW:STUDENT',        'TURMA'),
  ('PROFESSOR',     'VIEW:CLASS',          'TURMA'),
  ('PROFESSOR',     'VIEW:ENROLLMENT',     'TURMA'),
  ('PROFESSOR',     'VIEW:GUARDIAN',       'TURMA'),
  ('PROFESSOR',     'VIEW:GUARDIAN_LINK',  'TURMA'),
  ('PROFESSOR',     'VIEW:CONSENT',        'TURMA'),

  -- COORDENAÇÃO — o mesmo conteúdo por TURMA que o professor, porque o cargo não muda a
  -- natureza do dado: a foto de uma criança continua sendo da turma dela.
  ('COORDENACAO',   'VIEW:POST',           'TURMA'),
  ('COORDENACAO',   'CREATE:POST',         'TURMA'),
  ('COORDENACAO',   'UPDATE:POST',         'TURMA'),
  ('COORDENACAO',   'DELETE:POST',         'TURMA'),
  ('COORDENACAO',   'PUBLISH:POST',        'TURMA'),
  ('COORDENACAO',   'VIEW:MEDIA',          'TURMA'),
  ('COORDENACAO',   'CREATE:MEDIA',        'TURMA'),
  ('COORDENACAO',   'DELETE:MEDIA',        'TURMA'),
  ('COORDENACAO',   'VIEW:COMMENT',        'TURMA'),
  ('COORDENACAO',   'CREATE:COMMENT',      'TURMA'),
  ('COORDENACAO',   'DELETE:COMMENT',      'TURMA'),
  ('COORDENACAO',   'VIEW:REACTION',       'TURMA'),
  ('COORDENACAO',   'CREATE:REACTION',     'TURMA'),
  ('COORDENACAO',   'DELETE:REACTION',     'PROPRIA'),
  ('COORDENACAO',   'VIEW:REACTION_TYPE',  'ESCOLA'),
  ('COORDENACAO',   'VIEW:REPORT',         'TURMA'),
  ('COORDENACAO',   'PUBLISH:REPORT',      'TURMA'),
  ('COORDENACAO',   'VIEW:CONSENT',        'TURMA'),
  ('COORDENACAO',   'CREATE:CONSENT',      'TURMA'),
  ('COORDENACAO',   'REVOKE:CONSENT',      'TURMA'),

  -- ...e o cadastro por ESCOLA, que é o que distingue o cargo. Quem matricula precisa
  -- enxergar a escola inteira para achar a criança antes de ela ter turma.
  ('COORDENACAO',   'VIEW:SCHOOL',         'ESCOLA'),
  ('COORDENACAO',   'VIEW:SCHOOL_YEAR',    'ESCOLA'),
  ('COORDENACAO',   'CREATE:SCHOOL_YEAR',  'ESCOLA'),
  ('COORDENACAO',   'UPDATE:SCHOOL_YEAR',  'ESCOLA'),
  ('COORDENACAO',   'DELETE:SCHOOL_YEAR',  'ESCOLA'),
  ('COORDENACAO',   'VIEW:CLASS',          'ESCOLA'),
  ('COORDENACAO',   'CREATE:CLASS',        'ESCOLA'),
  ('COORDENACAO',   'UPDATE:CLASS',        'ESCOLA'),
  ('COORDENACAO',   'DELETE:CLASS',        'ESCOLA'),
  ('COORDENACAO',   'VIEW:PERSON',         'ESCOLA'),
  ('COORDENACAO',   'CREATE:PERSON',       'ESCOLA'),
  ('COORDENACAO',   'UPDATE:PERSON',       'ESCOLA'),
  ('COORDENACAO',   'VIEW:STUDENT',        'ESCOLA'),
  ('COORDENACAO',   'CREATE:STUDENT',      'ESCOLA'),
  ('COORDENACAO',   'UPDATE:STUDENT',      'ESCOLA'),
  ('COORDENACAO',   'VIEW:GUARDIAN',       'ESCOLA'),
  ('COORDENACAO',   'CREATE:GUARDIAN',     'ESCOLA'),
  ('COORDENACAO',   'UPDATE:GUARDIAN',     'ESCOLA'),
  ('COORDENACAO',   'VIEW:TEACHER',        'ESCOLA'),
  ('COORDENACAO',   'CREATE:TEACHER',      'ESCOLA'),
  ('COORDENACAO',   'UPDATE:TEACHER',      'ESCOLA'),
  ('COORDENACAO',   'VIEW:USER',           'ESCOLA'),
  ('COORDENACAO',   'CREATE:USER',         'ESCOLA'),
  ('COORDENACAO',   'UPDATE:USER',         'ESCOLA'),
  ('COORDENACAO',   'VIEW:ENROLLMENT',     'ESCOLA'),
  ('COORDENACAO',   'CREATE:ENROLLMENT',   'ESCOLA'),
  ('COORDENACAO',   'REVOKE:ENROLLMENT',   'ESCOLA'),
  ('COORDENACAO',   'VIEW:GUARDIAN_LINK',  'ESCOLA'),
  ('COORDENACAO',   'CREATE:GUARDIAN_LINK', 'ESCOLA'),
  ('COORDENACAO',   'UPDATE:GUARDIAN_LINK', 'ESCOLA'),
  ('COORDENACAO',   'REVOKE:GUARDIAN_LINK', 'ESCOLA'),
  ('COORDENACAO',   'VIEW:TEACHER_LINK',   'ESCOLA'),
  ('COORDENACAO',   'CREATE:TEACHER_LINK', 'ESCOLA'),
  ('COORDENACAO',   'REVOKE:TEACHER_LINK', 'ESCOLA'),
  ('COORDENACAO',   'VIEW:CLASS_ACCESS',   'ESCOLA'),
  ('COORDENACAO',   'CREATE:CLASS_ACCESS', 'ESCOLA'),
  ('COORDENACAO',   'REVOKE:CLASS_ACCESS', 'ESCOLA'),
  ('COORDENACAO',   'VIEW:ROLE',           'ESCOLA'),
  ('COORDENACAO',   'VIEW:ROLE_GRANT',     'ESCOLA'),
  ('COORDENACAO',   'CREATE:ROLE_GRANT',   'ESCOLA'),
  ('COORDENACAO',   'REVOKE:ROLE_GRANT',   'ESCOLA');

-- O que a coordenação NÃO recebe, de propósito: `CREATE:ROLE` e `UPDATE:ROLE` (desenhar
-- perfil é configurar o próprio modelo de autorização), `UPDATE:SCHOOL`, `DELETE:USER` e
-- `DELETE:STUDENT` (criança que sai da escola é `REVOKE:ENROLLMENT`, não exclusão de gente).
--
-- Ela recebe `CREATE:ROLE_GRANT`, e isso a deixa conceder perfil — inclusive o dela. O
-- `assert-no-escalation` é o que segura: ninguém concede o que não tem, então a coordenação
-- não consegue produzir um administrador.

-- Um JOIN silencioso descartaria capability escrita errada e o perfil nasceria mudo — o 403
-- inexplicável. Falhar aqui é barato; em produção não.
DO $$
DECLARE
  ausentes text;
BEGIN
  SELECT string_agg(DISTINCT c.codigo, ', ' ORDER BY c.codigo)
    INTO ausentes
  FROM concessao_sistema c
  LEFT JOIN permissao p ON p.codigo = c.codigo
  WHERE p.id IS NULL;

  IF ausentes IS NOT NULL THEN
    RAISE EXCEPTION 'Capability inexistente em PERMISSAO: %', ausentes;
  END IF;
END
$$;

-- Uma cópia de cada perfil para cada escola. O `DO UPDATE` adota o que já existir com o
-- mesmo código — é assim que os perfis comuns do `demo.sql` viram os de sistema sem que
-- nenhuma linha de `usuario_perfil` precise ser refeita.
INSERT INTO perfil (escola_id, codigo, nome, descricao, sistema)
SELECT e.id, ps.codigo, ps.nome, ps.descricao, true
FROM escola e
CROSS JOIN perfil_sistema ps
ON CONFLICT (escola_id, codigo) DO UPDATE SET
  nome          = EXCLUDED.nome,
  descricao     = EXCLUDED.descricao,
  sistema       = true,
  atualizado_em = now();

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_sistema c
INNER JOIN perfil f    ON f.codigo = c.perfil AND f.sistema = true
INNER JOIN permissao p ON p.codigo = c.codigo
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = EXCLUDED.abrangencia;

-- O ADMINISTRADOR recebe o catálogo inteiro em ESCOLA. Continua sendo o perfil que contorna
-- o isolamento por turma por construção — não o use para demonstrar o isolamento.
INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'ESCOLA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'ADMINISTRADOR' AND f.sistema = true
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = 'ESCOLA';

-- Autoritativa: concessão que saiu do catálogo sai do banco. Vale só para os perfis de
-- sistema, que ninguém edita pela API — perfil criado pela escola não é tocado aqui.
DELETE FROM perfil_permissao pp
USING perfil f, permissao p
WHERE pp.perfil_id = f.id
  AND pp.permissao_id = p.id
  AND f.sistema = true
  AND f.codigo <> 'ADMINISTRADOR'
  AND NOT EXISTS (
    SELECT 1 FROM concessao_sistema c
    WHERE c.perfil = f.codigo AND c.codigo = p.codigo
  );

DROP TABLE concessao_sistema;
DROP TABLE perfil_sistema;
