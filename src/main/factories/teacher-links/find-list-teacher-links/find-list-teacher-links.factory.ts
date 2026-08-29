import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListTeacherLinksUseCase } from '@modules/application/use-cases/teacher-links/find-list-teacher-links/find-list-teacher-links.usecase.js';
import { TeacherLinkRepository } from '@modules/infra/repositories/teacher-link.repository.js';
import { FindListTeacherLinksController } from '@modules/presentation/controllers/teacher-links/find-list-teacher-links/find-list-teacher-links.controller.js';

export const makeFindListTeacherLinksController = (): FindListTeacherLinksController =>
  new FindListTeacherLinksController(
    new FindListTeacherLinksUseCase(new TeacherLinkRepository(db.core)),
    authz.scopesOf,
  );
