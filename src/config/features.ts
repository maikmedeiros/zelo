export enum Feature {
  // CLASS — turma
  ClassCreate = 'CREATE:CLASS',
  ClassDelete = 'DELETE:CLASS',
  ClassUpdate = 'UPDATE:CLASS',
  ClassView = 'VIEW:CLASS',

  // CLASS_ACCESS — acesso_turma. É por aqui que coordenação e direção enxergam turma:
  // concessão explícita, uma a uma. Nenhum cargo abre atalho.
  ClassAccessCreate = 'CREATE:CLASS_ACCESS',
  ClassAccessRevoke = 'REVOKE:CLASS_ACCESS',
  ClassAccessView = 'VIEW:CLASS_ACCESS',

  // COMMENT — postagem_comentario. Um só DELETE serve aos dois casos que o modelo separa:
  // com abrangência PROPRIA o autor apaga o próprio comentário; com TURMA a escola modera o
  // de qualquer um. Quem traduz isso em REMOVIDO_PELO_AUTOR ou REMOVIDO_PELA_ESCOLA é o
  // controller, olhando se o ator é o autor.
  CommentCreate = 'CREATE:COMMENT',
  CommentDelete = 'DELETE:COMMENT',
  CommentView = 'VIEW:COMMENT',

  // CONSENT — consentimento. Não há UPDATE: consentimento é série temporal, criar é linha
  // nova e revogar fecha a vigência da linha atual.
  ConsentCreate = 'CREATE:CONSENT',
  ConsentRevoke = 'REVOKE:CONSENT',
  ConsentView = 'VIEW:CONSENT',

  // ENROLLMENT — matricula. Encerrar é REVOKE (fecha data_fim), nunca DELETE: a matrícula
  // responde "quem estava nesta turma na data X".
  EnrollmentCreate = 'CREATE:ENROLLMENT',
  EnrollmentRevoke = 'REVOKE:ENROLLMENT',
  EnrollmentView = 'VIEW:ENROLLMENT',

  // GUARDIAN — responsavel
  GuardianCreate = 'CREATE:GUARDIAN',
  GuardianUpdate = 'UPDATE:GUARDIAN',
  GuardianView = 'VIEW:GUARDIAN',

  // GUARDIAN_LINK — responsavel_aluno. O UPDATE existe por causa de `pode_consentir`, que
  // decide quem tem legitimidade para consentir (LGPD art. 14 §1).
  GuardianLinkCreate = 'CREATE:GUARDIAN_LINK',
  GuardianLinkRevoke = 'REVOKE:GUARDIAN_LINK',
  GuardianLinkUpdate = 'UPDATE:GUARDIAN_LINK',
  GuardianLinkView = 'VIEW:GUARDIAN_LINK',

  // MEDIA — midia
  MediaCreate = 'CREATE:MEDIA',
  MediaDelete = 'DELETE:MEDIA',
  MediaView = 'VIEW:MEDIA',

  // PERSON — pessoa. Sem DELETE: apagar pessoa esbarra nos RESTRICT de consentimento e de
  // comprovante de entrega, e é operação de expurgo, não de cadastro.
  PersonCreate = 'CREATE:PERSON',
  PersonUpdate = 'UPDATE:PERSON',
  PersonView = 'VIEW:PERSON',

  // POST — postagem
  PostCreate = 'CREATE:POST',
  PostDelete = 'DELETE:POST',
  PostPublish = 'PUBLISH:POST',
  PostUpdate = 'UPDATE:POST',
  PostView = 'VIEW:POST',

  // REACTION — postagem_reacao. Trocar de reação é UPDATE do próprio registro, coberto por
  // CREATE (upsert de "minha reação nesta postagem"); DELETE é retirar a reação.
  ReactionCreate = 'CREATE:REACTION',
  ReactionDelete = 'DELETE:REACTION',
  ReactionView = 'VIEW:REACTION',

  // REACTION_TYPE — reacao (o catálogo: emoji, rótulo e ordem do seletor). Só leitura: a
  // manutenção do catálogo é rara e vive em migration. Se virar tela, entram CREATE/UPDATE.
  ReactionTypeView = 'VIEW:REACTION_TYPE',

  // REPORT — relatorio_adaptacao. Exportar em PDF é VIEW numa representação diferente, não
  // permissão à parte — EXPORT não está entre as seis ações do modelo.
  ReportCreate = 'CREATE:REPORT',
  ReportDelete = 'DELETE:REPORT',
  ReportPublish = 'PUBLISH:REPORT',
  ReportUpdate = 'UPDATE:REPORT',
  ReportView = 'VIEW:REPORT',

  // ROLE — perfil. Sem DELETE: perfil de sistema não se apaga (coluna `sistema`).
  RoleCreate = 'CREATE:ROLE',
  RoleUpdate = 'UPDATE:ROLE',
  RoleView = 'VIEW:ROLE',

  // ROLE_GRANT — usuario_perfil
  RoleGrantCreate = 'CREATE:ROLE_GRANT',
  RoleGrantRevoke = 'REVOKE:ROLE_GRANT',
  RoleGrantView = 'VIEW:ROLE_GRANT',

  // SCHOOL — escola. Não se cria nem se apaga escola pela API no MVP.
  SchoolUpdate = 'UPDATE:SCHOOL',
  SchoolView = 'VIEW:SCHOOL',

  // SCHOOL_YEAR — ano_letivo
  SchoolYearCreate = 'CREATE:SCHOOL_YEAR',
  SchoolYearDelete = 'DELETE:SCHOOL_YEAR',
  SchoolYearUpdate = 'UPDATE:SCHOOL_YEAR',
  SchoolYearView = 'VIEW:SCHOOL_YEAR',

  // STUDENT — aluno
  StudentCreate = 'CREATE:STUDENT',
  StudentDelete = 'DELETE:STUDENT',
  StudentUpdate = 'UPDATE:STUDENT',
  StudentView = 'VIEW:STUDENT',

  // TEACHER — professor
  TeacherCreate = 'CREATE:TEACHER',
  TeacherUpdate = 'UPDATE:TEACHER',
  TeacherView = 'VIEW:TEACHER',

  // TEACHER_LINK — professor_turma. Trocar de professora no meio do ano é REVOKE (fecha
  // data_fim), nunca DELETE: o histórico de quem teve acesso a quê é pergunta de auditoria.
  TeacherLinkCreate = 'CREATE:TEACHER_LINK',
  TeacherLinkRevoke = 'REVOKE:TEACHER_LINK',
  TeacherLinkView = 'VIEW:TEACHER_LINK',

  // USER — usuario
  UserCreate = 'CREATE:USER',
  UserDelete = 'DELETE:USER',
  UserUpdate = 'UPDATE:USER',
  UserView = 'VIEW:USER',
}
