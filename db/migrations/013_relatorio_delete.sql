-- DELETE:REPORT deixa de ser exclusivo do administrador.
--
-- A 010 tirou o DELETE dos dois perfis de propósito: "relatório apagado é documento sobre uma
-- criança que some". O argumento vale para o PUBLICADO e não vale para o RASCUNHO — rascunho
-- é texto em edição, ninguém recebeu, e obrigar a professora a pedir ao administrador para
-- descartar um relatório que nasceu com a criança errada não protege criança nenhuma.
--
-- O que preserva o documento entregue passa a ser o use-case, que recusa remover PUBLICADO
-- com 409 — a mesma regra que já vale para o UPDATE. Antes desta migration a API apagava
-- publicado sem reclamar, o que contradizia o próprio "publicar congela".
CREATE TEMP TABLE concessao_delete (perfil text, escopo abrangencia);

INSERT INTO concessao_delete (perfil, escopo) VALUES
  ('PROFESSOR',   'PROPRIA'),
  ('COORDENACAO', 'TURMA');

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_delete c
INNER JOIN perfil f ON f.codigo = c.perfil AND f.sistema = true
CROSS JOIN permissao p
WHERE p.codigo = 'DELETE:REPORT'
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = EXCLUDED.abrangencia;

DROP TABLE concessao_delete;
