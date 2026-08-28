-- Escola padrão, catálogo de permissões e o perfil ADMINISTRADOR de bootstrap.
--
-- ATENÇÃO: o ADMINISTRADOR recebe TUDO com abrangência ESCOLA, e ESCOLA ignora o vínculo de
-- turma. Isso existe para destravar o desenvolvimento — NÃO use este perfil na demonstração
-- do isolamento por turma, porque ele o contorna por construção.

-- Id fixo, não gerado: é linha de bootstrap, e um valor estável entre resets permite
-- referenciá-la direto no Postman e nas migrations seguintes.
INSERT INTO escola (id, nome) VALUES ('00000000-0000-0000-0000-000000000001', 'ZELO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO permissao (codigo, acao, recurso) VALUES
  ('CREATE:CLASS',         'CREATE',   'CLASS'),
  ('CREATE:CLASS_ACCESS',  'CREATE',   'CLASS_ACCESS'),
  ('CREATE:COMMENT',       'CREATE',   'COMMENT'),
  ('CREATE:CONSENT',       'CREATE',   'CONSENT'),
  ('CREATE:ENROLLMENT',    'CREATE',   'ENROLLMENT'),
  ('CREATE:GUARDIAN',      'CREATE',   'GUARDIAN'),
  ('CREATE:GUARDIAN_LINK', 'CREATE',   'GUARDIAN_LINK'),
  ('CREATE:MEDIA',         'CREATE',   'MEDIA'),
  ('CREATE:PERSON',        'CREATE',   'PERSON'),
  ('CREATE:POST',          'CREATE',   'POST'),
  ('CREATE:REACTION',      'CREATE',   'REACTION'),
  ('CREATE:REPORT',        'CREATE',   'REPORT'),
  ('CREATE:ROLE',          'CREATE',   'ROLE'),
  ('CREATE:ROLE_GRANT',    'CREATE',   'ROLE_GRANT'),
  ('CREATE:SCHOOL_YEAR',   'CREATE',   'SCHOOL_YEAR'),
  ('CREATE:STUDENT',       'CREATE',   'STUDENT'),
  ('CREATE:TEACHER',       'CREATE',   'TEACHER'),
  ('CREATE:TEACHER_LINK',  'CREATE',   'TEACHER_LINK'),
  ('CREATE:USER',          'CREATE',   'USER'),
  ('DELETE:CLASS',         'DELETE',   'CLASS'),
  ('DELETE:COMMENT',       'DELETE',   'COMMENT'),
  ('DELETE:MEDIA',         'DELETE',   'MEDIA'),
  ('DELETE:POST',          'DELETE',   'POST'),
  ('DELETE:REACTION',      'DELETE',   'REACTION'),
  ('DELETE:REPORT',        'DELETE',   'REPORT'),
  ('DELETE:SCHOOL_YEAR',   'DELETE',   'SCHOOL_YEAR'),
  ('DELETE:STUDENT',       'DELETE',   'STUDENT'),
  ('DELETE:USER',          'DELETE',   'USER'),
  ('PUBLISH:POST',         'PUBLISH',  'POST'),
  ('PUBLISH:REPORT',       'PUBLISH',  'REPORT'),
  ('REVOKE:CLASS_ACCESS',  'REVOKE',   'CLASS_ACCESS'),
  ('REVOKE:CONSENT',       'REVOKE',   'CONSENT'),
  ('REVOKE:ENROLLMENT',    'REVOKE',   'ENROLLMENT'),
  ('REVOKE:GUARDIAN_LINK', 'REVOKE',   'GUARDIAN_LINK'),
  ('REVOKE:ROLE_GRANT',    'REVOKE',   'ROLE_GRANT'),
  ('REVOKE:TEACHER_LINK',  'REVOKE',   'TEACHER_LINK'),
  ('UPDATE:CLASS',         'UPDATE',   'CLASS'),
  ('UPDATE:GUARDIAN',      'UPDATE',   'GUARDIAN'),
  ('UPDATE:GUARDIAN_LINK', 'UPDATE',   'GUARDIAN_LINK'),
  ('UPDATE:PERSON',        'UPDATE',   'PERSON'),
  ('UPDATE:POST',          'UPDATE',   'POST'),
  ('UPDATE:REPORT',        'UPDATE',   'REPORT'),
  ('UPDATE:ROLE',          'UPDATE',   'ROLE'),
  ('UPDATE:SCHOOL',        'UPDATE',   'SCHOOL'),
  ('UPDATE:SCHOOL_YEAR',   'UPDATE',   'SCHOOL_YEAR'),
  ('UPDATE:STUDENT',       'UPDATE',   'STUDENT'),
  ('UPDATE:TEACHER',       'UPDATE',   'TEACHER'),
  ('UPDATE:USER',          'UPDATE',   'USER'),
  ('VIEW:CLASS',           'VIEW',     'CLASS'),
  ('VIEW:CLASS_ACCESS',    'VIEW',     'CLASS_ACCESS'),
  ('VIEW:COMMENT',         'VIEW',     'COMMENT'),
  ('VIEW:CONSENT',         'VIEW',     'CONSENT'),
  ('VIEW:ENROLLMENT',      'VIEW',     'ENROLLMENT'),
  ('VIEW:GUARDIAN',        'VIEW',     'GUARDIAN'),
  ('VIEW:GUARDIAN_LINK',   'VIEW',     'GUARDIAN_LINK'),
  ('VIEW:MEDIA',           'VIEW',     'MEDIA'),
  ('VIEW:PERSON',          'VIEW',     'PERSON'),
  ('VIEW:POST',            'VIEW',     'POST'),
  ('VIEW:REACTION',        'VIEW',     'REACTION'),
  ('VIEW:REACTION_TYPE',   'VIEW',     'REACTION_TYPE'),
  ('VIEW:REPORT',          'VIEW',     'REPORT'),
  ('VIEW:ROLE',            'VIEW',     'ROLE'),
  ('VIEW:ROLE_GRANT',      'VIEW',     'ROLE_GRANT'),
  ('VIEW:SCHOOL',          'VIEW',     'SCHOOL'),
  ('VIEW:SCHOOL_YEAR',     'VIEW',     'SCHOOL_YEAR'),
  ('VIEW:STUDENT',         'VIEW',     'STUDENT'),
  ('VIEW:TEACHER',         'VIEW',     'TEACHER'),
  ('VIEW:TEACHER_LINK',    'VIEW',     'TEACHER_LINK'),
  ('VIEW:USER',            'VIEW',     'USER')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO perfil (escola_id, codigo, nome, descricao, sistema)
VALUES ('00000000-0000-0000-0000-000000000001', 'ADMINISTRADOR', 'Administrador', 'Acesso irrestrito. Uso interno.', true)
ON CONFLICT DO NOTHING;

INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
SELECT f.id, p.id, 'ESCOLA'
FROM perfil f
CROSS JOIN permissao p
WHERE f.codigo = 'ADMINISTRADOR' AND f.escola_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Usuário de bootstrap: login 'admin', senha 'admin' (argon2id).
-- CREDENCIAL CONHECIDA E VERSIONADA NO GIT. Serve só para destravar o desenvolvimento —
-- antes de qualquer ambiente exposto, troque a senha ou remova esta linha.
INSERT INTO pessoa (id, escola_id, nome) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Administrador')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuario (id, pessoa_id, email, senha_hash, email_verificado)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'admin', '$argon2id$v=19$m=19456,t=2,p=1$AUxgrj2ir9GW5HcylXPNrA$SvL7+EH0D5kvammJWLFRQCxIIdAgHkG8dpg2ySnLkBM', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuario_perfil (usuario_id, perfil_id)
SELECT '00000000-0000-0000-0000-000000000003', f.id
FROM perfil f
WHERE f.codigo = 'ADMINISTRADOR' AND f.escola_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Token de API do administrador, para Postman e scripts. O valor em claro NÃO fica aqui —
-- só o SHA-256. Ele está registrado no README, junto da senha do admin.
-- Mesma dívida do usuário 'admin': credencial conhecida e versionada. Só desenvolvimento.
INSERT INTO api_token (usuario_id, nome, prefixo, token_hash, ambiente, expira_em)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Postman (bootstrap)',
  'zelo_2_wgC4G',
  'cdb3bf6a0550c71fa8b74629cf84a902925942581e02ca80c5ad70399aee7678',
  'DESENVOLVIMENTO',
  now() + interval '90 days'
)
ON CONFLICT (token_hash) DO NOTHING;
