-- Concessão de capabilities por perfil, COM escopo.
--
-- O catálogo cru vive no enum `Feature` (src/config/features.ts); o escopo é decidido aqui.
-- Ao adicionar uma capability ao enum, conceda-a nesta migration.
--
-- Escopos: `any` (tudo), `group` (turmas às quais o ator está ligado), `own` (o que criou).

INSERT INTO perfil_capability (perfil, capability) VALUES
  -- direcao: visão completa da escola
  ('direcao',      'ZELO:aluno:create:any'),
  ('direcao',      'ZELO:aluno:delete:any'),
  ('direcao',      'ZELO:aluno:list:any'),
  ('direcao',      'ZELO:aluno:read:any'),
  ('direcao',      'ZELO:aluno:update:any'),
  ('direcao',      'ZELO:auditoria:list:any'),
  ('direcao',      'ZELO:consentimento_imagem:list:any'),
  ('direcao',      'ZELO:consentimento_imagem:read:any'),
  ('direcao',      'ZELO:escola:read:any'),
  ('direcao',      'ZELO:escola:update:any'),
  ('direcao',      'ZELO:postagem:delete:any'),
  ('direcao',      'ZELO:postagem:list:any'),
  ('direcao',      'ZELO:postagem:read:any'),
  ('direcao',      'ZELO:relatorio_adaptacao:export:any'),
  ('direcao',      'ZELO:relatorio_adaptacao:list:any'),
  ('direcao',      'ZELO:relatorio_adaptacao:read:any'),
  ('direcao',      'ZELO:turma:create:any'),
  ('direcao',      'ZELO:turma:list:any'),
  ('direcao',      'ZELO:turma:read:any'),
  ('direcao',      'ZELO:turma:update:any'),
  ('direcao',      'ZELO:usuario:create:any'),
  ('direcao',      'ZELO:usuario:list:any'),
  ('direcao',      'ZELO:usuario:read:any'),
  ('direcao',      'ZELO:usuario:update:any'),

  -- coordenacao: opera o pedagógico em todas as turmas, sem mexer na escola
  ('coordenacao',  'ZELO:aluno:create:any'),
  ('coordenacao',  'ZELO:aluno:list:any'),
  ('coordenacao',  'ZELO:aluno:read:any'),
  ('coordenacao',  'ZELO:aluno:update:any'),
  ('coordenacao',  'ZELO:auditoria:list:any'),
  ('coordenacao',  'ZELO:consentimento_imagem:list:any'),
  ('coordenacao',  'ZELO:consentimento_imagem:read:any'),
  ('coordenacao',  'ZELO:escola:read:any'),
  ('coordenacao',  'ZELO:postagem:create:any'),
  ('coordenacao',  'ZELO:postagem:delete:any'),
  ('coordenacao',  'ZELO:postagem:list:any'),
  ('coordenacao',  'ZELO:postagem:read:any'),
  ('coordenacao',  'ZELO:postagem:update:any'),
  ('coordenacao',  'ZELO:postagem_midia:create:any'),
  ('coordenacao',  'ZELO:postagem_midia:delete:any'),
  ('coordenacao',  'ZELO:relatorio_adaptacao:create:any'),
  ('coordenacao',  'ZELO:relatorio_adaptacao:export:any'),
  ('coordenacao',  'ZELO:relatorio_adaptacao:list:any'),
  ('coordenacao',  'ZELO:relatorio_adaptacao:read:any'),
  ('coordenacao',  'ZELO:relatorio_adaptacao:update:any'),
  ('coordenacao',  'ZELO:turma:list:any'),
  ('coordenacao',  'ZELO:turma:read:any'),

  -- professor: escopo `group` — só as turmas atribuídas a ele. Remove `postagem:delete`
  -- do escopo amplo: professor apaga o que ele mesmo publicou (`own`).
  ('professor',    'ZELO:aluno:list:group'),
  ('professor',    'ZELO:aluno:read:group'),
  ('professor',    'ZELO:consentimento_imagem:read:group'),
  ('professor',    'ZELO:postagem:create:group'),
  ('professor',    'ZELO:postagem:delete:own'),
  ('professor',    'ZELO:postagem:list:group'),
  ('professor',    'ZELO:postagem:read:group'),
  ('professor',    'ZELO:postagem:update:own'),
  ('professor',    'ZELO:postagem_midia:create:group'),
  ('professor',    'ZELO:postagem_midia:delete:own'),
  ('professor',    'ZELO:relatorio_adaptacao:create:group'),
  ('professor',    'ZELO:relatorio_adaptacao:list:group'),
  ('professor',    'ZELO:relatorio_adaptacao:read:group'),
  ('professor',    'ZELO:relatorio_adaptacao:update:own'),
  ('professor',    'ZELO:turma:list:group'),
  ('professor',    'ZELO:turma:read:group'),

  -- responsavel: só leitura, e só das turmas dos próprios filhos. O escopo `group` aqui é
  -- resolvido pela CTE `turma_visivel` — nenhuma capability `:any` para este perfil.
  ('responsavel',  'ZELO:aluno:read:group'),
  ('responsavel',  'ZELO:consentimento_imagem:create:group'),
  ('responsavel',  'ZELO:consentimento_imagem:list:group'),
  ('responsavel',  'ZELO:consentimento_imagem:read:group'),
  ('responsavel',  'ZELO:consentimento_imagem:revoke:group'),
  ('responsavel',  'ZELO:postagem:list:group'),
  ('responsavel',  'ZELO:postagem:read:group'),
  ('responsavel',  'ZELO:relatorio_adaptacao:export:group'),
  ('responsavel',  'ZELO:relatorio_adaptacao:list:group'),
  ('responsavel',  'ZELO:relatorio_adaptacao:read:group'),
  ('responsavel',  'ZELO:turma:list:group'),
  ('responsavel',  'ZELO:turma:read:group')
ON CONFLICT DO NOTHING;
