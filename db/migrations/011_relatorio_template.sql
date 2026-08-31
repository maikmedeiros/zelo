-- Template de preenchimento do relatório de adaptação.
--
-- O template NÃO define a estrutura do relatório: as sete dimensões e os quatro níveis são
-- do enum, desde a 001, e é isso que faz dois relatórios da mesma criança em março e em
-- junho serem comparáveis. O template guarda o TEXTO que a professora repete — o parecer
-- padrão dela para SONO, para ALIMENTACAO — para que criar um relatório novo comece
-- preenchido e ela edite só o que for daquela criança.
--
-- Se o template definisse a estrutura, o auxílio de preenchimento deixaria de existir: não
-- haveria "o campo SONO" onde pousar o texto salvo.

CREATE TABLE relatorio_template (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     uuid NOT NULL REFERENCES escola (id) ON DELETE RESTRICT,
  nome          text NOT NULL,
  descricao     text,
  sintese       text,
  criado_por    uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- O template é da ESCOLA, não da autora: qualquer professora usa o que a colega escreveu, e
-- é assim que a linguagem da casa se padroniza. `criado_por` fica como autoria — auditoria e
-- chave da abrangência PROPRIA de quem pode editar —, nunca como recorte de leitura.
COMMENT ON COLUMN relatorio_template.criado_por IS
  'Autoria. Não restringe leitura: o template é da escola inteira.';

-- Índice PARCIAL: nome repetido só é conflito entre os vigentes. Reaproveitar o nome de um
-- template arquivado é legítimo.
CREATE UNIQUE INDEX uq_relatorio_template_nome
  ON relatorio_template (escola_id, lower(nome)) WHERE ativo;

CREATE INDEX idx_relatorio_template_escola
  ON relatorio_template (escola_id) WHERE ativo;

CREATE TABLE relatorio_template_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES relatorio_template (id) ON DELETE CASCADE,
  dimensao    dimensao_adaptacao NOT NULL,
  nivel       nivel_adaptacao,
  observacao  text,
  CONSTRAINT template_item_tem_conteudo
    CHECK (nivel IS NOT NULL OR observacao IS NOT NULL)
);

-- `nivel` nulo é o caso comum: o texto padrão vale para a dimensão, e o nível é o que a
-- professora observa naquela criança. Ao aplicar o template, nulo vira NAO_OBSERVADO.
COMMENT ON COLUMN relatorio_template_item.nivel IS
  'Nível sugerido. NULL = o template não presume nível, só oferece o texto.';

-- Espelha `uq_relatorio_dimensao` do relatório: uma linha por dimensão, no máximo.
CREATE UNIQUE INDEX uq_relatorio_template_dimensao
  ON relatorio_template_item (template_id, dimensao);

-- Rastreio, não referência viva. O relatório fica com CÓPIA dos textos, então editar o
-- template depois não muda documento já emitido — a mesma razão pela qual o consentimento
-- não é sobrescrito. `SET NULL` porque o rastro pode sobreviver ao template.
ALTER TABLE relatorio_adaptacao
  ADD COLUMN IF NOT EXISTS template_origem_id uuid
    REFERENCES relatorio_template (id) ON DELETE SET NULL;

COMMENT ON COLUMN relatorio_adaptacao.template_origem_id IS
  'De qual template este relatório nasceu. Rastreio; os valores já foram copiados.';

INSERT INTO permissao (codigo, acao, recurso) VALUES
  ('VIEW:REPORT_TEMPLATE',   'VIEW',   'REPORT_TEMPLATE'),
  ('CREATE:REPORT_TEMPLATE', 'CREATE', 'REPORT_TEMPLATE'),
  ('UPDATE:REPORT_TEMPLATE', 'UPDATE', 'REPORT_TEMPLATE'),
  ('DELETE:REPORT_TEMPLATE', 'DELETE', 'REPORT_TEMPLATE')
ON CONFLICT (codigo) DO NOTHING;

-- Ler e criar em ESCOLA: a biblioteca é comum e escrever nela é contribuir com a casa.
-- Alterar e arquivar em PROPRIA para quem leciona — mexer no texto da colega não —, e em
-- ESCOLA para a coordenação, que é quem cura a biblioteca.
-- O RESPONSAVEL fica de fora inteiro: template é ferramenta de trabalho da equipe.
CREATE TEMP TABLE concessao_template (perfil text, codigo text, escopo abrangencia);

INSERT INTO concessao_template (perfil, codigo, escopo) VALUES
  ('PROFESSOR',   'VIEW:REPORT_TEMPLATE',   'ESCOLA'),
  ('PROFESSOR',   'CREATE:REPORT_TEMPLATE', 'ESCOLA'),
  ('PROFESSOR',   'UPDATE:REPORT_TEMPLATE', 'PROPRIA'),
  ('PROFESSOR',   'DELETE:REPORT_TEMPLATE', 'PROPRIA'),
  ('COORDENACAO', 'VIEW:REPORT_TEMPLATE',   'ESCOLA'),
  ('COORDENACAO', 'CREATE:REPORT_TEMPLATE', 'ESCOLA'),
  ('COORDENACAO', 'UPDATE:REPORT_TEMPLATE', 'ESCOLA'),
  ('COORDENACAO', 'DELETE:REPORT_TEMPLATE', 'ESCOLA');

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_template c
INNER JOIN perfil f    ON f.codigo = c.perfil AND f.sistema = true
INNER JOIN permissao p ON p.codigo = c.codigo
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = EXCLUDED.abrangencia;

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'ESCOLA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'ADMINISTRADOR' AND f.sistema = true
  AND p.recurso = 'REPORT_TEMPLATE'
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = 'ESCOLA';

DROP TABLE concessao_template;
