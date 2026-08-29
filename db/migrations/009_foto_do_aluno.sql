-- `UPDATE:PHOTO` sobe de `PROPRIA` para `TURMA` no responsável e no professor.
--
-- A 008 deu `PROPRIA`, e `PROPRIA` é literalmente "a minha": o pai não conseguia subir a
-- foto do próprio filho e a professora não conseguia subir a da criança da turma dela. Só a
-- coordenação conseguia, por ter `ESCOLA` — o que empurraria toda foto de criança para a
-- secretaria, que não é quem convive com ela.
--
-- `TURMA` aqui NÃO significa "qualquer pessoa da turma". Quem resolve o alcance é o SQL do
-- repositório, pelo `alunoVisivelParaAtor`, que separa as duas origens:
--
--   * o responsável chega à criança pelo VÍNCULO (`responsavel_aluno`), então alcança o
--     filho e nenhuma outra criança — nem a que senta ao lado dele na mesma sala;
--   * a equipe chega pela TURMA (`professor_turma` e `acesso_turma`), então alcança os
--     alunos matriculados nas turmas em que leciona ou tem acesso, e mais ninguém.
--
-- A própria pessoa continua alcançável em qualquer abrangência: trocar a própria foto é o
-- caso comum, e é o que a 008 já garantia.
--
-- O que ninguém ganha: foto de adulto alheio. O pai não troca a foto da professora, e a
-- professora não troca a do pai — `alunoVisivelParaAtor` só olha para `aluno`.
UPDATE perfil_permissao pp
SET abrangencia = 'TURMA'
FROM perfil f, permissao p
WHERE pp.perfil_id = f.id
  AND pp.permissao_id = p.id
  AND f.sistema = true
  AND f.codigo IN ('RESPONSAVEL', 'PROFESSOR')
  AND p.codigo = 'UPDATE:PHOTO';
