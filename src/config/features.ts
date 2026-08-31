export enum Feature {
  ClassCreate = 'CREATE:CLASS',
  ClassDelete = 'DELETE:CLASS',
  ClassUpdate = 'UPDATE:CLASS',
  ClassView = 'VIEW:CLASS',

  ClassAccessCreate = 'CREATE:CLASS_ACCESS',
  ClassAccessRevoke = 'REVOKE:CLASS_ACCESS',
  ClassAccessView = 'VIEW:CLASS_ACCESS',

  CommentCreate = 'CREATE:COMMENT',
  CommentDelete = 'DELETE:COMMENT',
  CommentView = 'VIEW:COMMENT',

  ConsentCreate = 'CREATE:CONSENT',
  ConsentRevoke = 'REVOKE:CONSENT',
  ConsentView = 'VIEW:CONSENT',

  EnrollmentCreate = 'CREATE:ENROLLMENT',
  EnrollmentRevoke = 'REVOKE:ENROLLMENT',
  EnrollmentView = 'VIEW:ENROLLMENT',

  GuardianCreate = 'CREATE:GUARDIAN',
  GuardianUpdate = 'UPDATE:GUARDIAN',
  GuardianView = 'VIEW:GUARDIAN',

  GuardianLinkCreate = 'CREATE:GUARDIAN_LINK',
  GuardianLinkRevoke = 'REVOKE:GUARDIAN_LINK',
  GuardianLinkUpdate = 'UPDATE:GUARDIAN_LINK',
  GuardianLinkView = 'VIEW:GUARDIAN_LINK',

  JournalCreate = 'CREATE:JOURNAL',
  JournalDelete = 'DELETE:JOURNAL',
  JournalUpdate = 'UPDATE:JOURNAL',
  JournalView = 'VIEW:JOURNAL',

  MediaCreate = 'CREATE:MEDIA',
  MediaDelete = 'DELETE:MEDIA',
  MediaView = 'VIEW:MEDIA',

  PersonCreate = 'CREATE:PERSON',
  PersonUpdate = 'UPDATE:PERSON',
  PersonView = 'VIEW:PERSON',

  /**
   * A foto de perfil é recurso próprio, e não parte de `PERSON`, porque a régua é outra:
   * todo usuário troca a própria foto — inclusive o responsável, que não tem permissão de
   * editar cadastro de pessoa.
   */
  PhotoUpdate = 'UPDATE:PHOTO',
  PhotoView = 'VIEW:PHOTO',

  PostCreate = 'CREATE:POST',
  PostDelete = 'DELETE:POST',
  PostPublish = 'PUBLISH:POST',
  PostUpdate = 'UPDATE:POST',
  PostView = 'VIEW:POST',

  ReactionCreate = 'CREATE:REACTION',
  ReactionDelete = 'DELETE:REACTION',
  ReactionView = 'VIEW:REACTION',

  ReactionTypeView = 'VIEW:REACTION_TYPE',

  ReportCreate = 'CREATE:REPORT',
  ReportDelete = 'DELETE:REPORT',
  ReportPublish = 'PUBLISH:REPORT',
  ReportUpdate = 'UPDATE:REPORT',
  ReportView = 'VIEW:REPORT',

  ReportTemplateCreate = 'CREATE:REPORT_TEMPLATE',
  ReportTemplateDelete = 'DELETE:REPORT_TEMPLATE',
  ReportTemplateUpdate = 'UPDATE:REPORT_TEMPLATE',
  ReportTemplateView = 'VIEW:REPORT_TEMPLATE',

  RoleCreate = 'CREATE:ROLE',
  RoleUpdate = 'UPDATE:ROLE',
  RoleView = 'VIEW:ROLE',

  RoleGrantCreate = 'CREATE:ROLE_GRANT',
  RoleGrantRevoke = 'REVOKE:ROLE_GRANT',
  RoleGrantView = 'VIEW:ROLE_GRANT',

  SchoolUpdate = 'UPDATE:SCHOOL',
  SchoolView = 'VIEW:SCHOOL',

  SchoolYearCreate = 'CREATE:SCHOOL_YEAR',
  SchoolYearDelete = 'DELETE:SCHOOL_YEAR',
  SchoolYearUpdate = 'UPDATE:SCHOOL_YEAR',
  SchoolYearView = 'VIEW:SCHOOL_YEAR',

  StudentCreate = 'CREATE:STUDENT',
  StudentDelete = 'DELETE:STUDENT',
  StudentUpdate = 'UPDATE:STUDENT',
  StudentView = 'VIEW:STUDENT',

  TeacherCreate = 'CREATE:TEACHER',
  TeacherUpdate = 'UPDATE:TEACHER',
  TeacherView = 'VIEW:TEACHER',

  TeacherLinkCreate = 'CREATE:TEACHER_LINK',
  TeacherLinkRevoke = 'REVOKE:TEACHER_LINK',
  TeacherLinkView = 'VIEW:TEACHER_LINK',

  UserCreate = 'CREATE:USER',
  UserDelete = 'DELETE:USER',
  UserUpdate = 'UPDATE:USER',
  UserView = 'VIEW:USER',
}
