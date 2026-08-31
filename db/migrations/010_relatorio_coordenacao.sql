-- A coordenação escreve relatório, e não só publica.
--
-- A 007 deu a ela VIEW e PUBLISH, desenhando um papel de aprovadora que revisa o rascunho da
-- professora e libera para a família. Na prática da creche quem coordena também redige — o
-- relatório da criança em adaptação costuma sair a quatro mãos, e obrigar a coordenadora a
-- pedir para a professora corrigir uma frase trava o fluxo sem proteger nada.
--
-- Fica igual ao PROFESSOR: VIEW, CREATE, UPDATE e PUBLISH em TURMA. DELETE segue fora dos
-- dois — relatório apagado é documento sobre uma criança que some, e isso continua sendo
-- ato do administrador.
INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'TURMA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'COORDENACAO' AND f.sistema = true
  AND p.codigo IN ('CREATE:REPORT', 'UPDATE:REPORT')
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = 'TURMA';
