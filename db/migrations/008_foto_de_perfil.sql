-- Foto de perfil da PESSOA.
--
-- Na PESSOA, e não no USUARIO, por dois motivos. O rosto é da pessoa, não da credencial: se
-- a conta for desativada e recriada, a foto continua sendo a mesma pessoa. E criança é
-- PESSOA sem USUARIO — pendurar a foto no login deixaria as três crianças do modelo de fora,
-- justamente quem mais aparece em foto numa escola infantil.
--
-- Guarda o caminho relativo à raiz do storage (`public/imagens/`), não a URL: a URL depende
-- de host e de prefixo de rota, que mudam entre ambientes, e o `TODO(cdn)` do
-- `file-storage.ts` vai trocar a base sem que nenhuma linha do banco precise mudar.
ALTER TABLE pessoa ADD COLUMN IF NOT EXISTS foto_chave text;

COMMENT ON COLUMN pessoa.foto_chave IS
  'Caminho da imagem relativo à raiz do storage, ex.: pessoas/ana-ribeiro-a1b2c3d4e5f6.jpg';

-- Duas capabilities novas. Elas existem separadas de `VIEW:PERSON` / `UPDATE:PERSON` porque
-- a régua é outra: **todo usuário troca a própria foto**, inclusive o responsável, que não
-- tem — e não deve ter — permissão de editar cadastro de pessoa.
INSERT INTO permissao (codigo, acao, recurso) VALUES
  ('VIEW:PHOTO',   'VIEW',   'PHOTO'),
  ('UPDATE:PHOTO', 'UPDATE', 'PHOTO')
ON CONFLICT (codigo) DO NOTHING;

-- `PROPRIA` para os quatro perfis: a sua foto é sua. `ESCOLA` para quem toca cadastro, que
-- é quem corrige a foto trocada ou imprópria de outra pessoa.
--
-- `VIEW:PHOTO` em `TURMA` para todo mundo: enxergar o rosto de quem divide a turma com o
-- filho é o que dá sentido ao mural. Fora da turma, não — e é o mesmo recorte que já vale
-- para a postagem, resolvido pelo mesmo `sql/pessoa-escopo.ts`.
CREATE TEMP TABLE concessao_foto (perfil text, codigo text, escopo abrangencia);

INSERT INTO concessao_foto (perfil, codigo, escopo) VALUES
  ('RESPONSAVEL', 'VIEW:PHOTO',   'TURMA'),
  ('RESPONSAVEL', 'UPDATE:PHOTO', 'PROPRIA'),
  ('PROFESSOR',   'VIEW:PHOTO',   'TURMA'),
  ('PROFESSOR',   'UPDATE:PHOTO', 'PROPRIA'),
  ('COORDENACAO', 'VIEW:PHOTO',   'ESCOLA'),
  ('COORDENACAO', 'UPDATE:PHOTO', 'ESCOLA');

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, c.escopo
FROM concessao_foto c
INNER JOIN perfil f    ON f.codigo = c.perfil AND f.sistema = true
INNER JOIN permissao p ON p.codigo = c.codigo
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = EXCLUDED.abrangencia;

-- O ADMINISTRADOR recebe as novas em ESCOLA, como recebe todo o catálogo.
INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'ESCOLA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'ADMINISTRADOR' AND f.sistema = true
  AND p.codigo IN ('VIEW:PHOTO', 'UPDATE:PHOTO')
ON CONFLICT (perfil_id, permissao_id) DO UPDATE SET abrangencia = 'ESCOLA';

DROP TABLE concessao_foto;
