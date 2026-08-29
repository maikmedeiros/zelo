import { db } from '@config/database.js';
import { RevokeTeacherLinkUseCase } from '@modules/application/use-cases/teacher-links/revoke-teacher-link/revoke-teacher-link.usecase.js';
import { TeacherLinkRepository } from '@modules/infra/repositories/teacher-link.repository.js';
import { RevokeTeacherLinkController } from '@modules/presentation/controllers/teacher-links/revoke-teacher-link/revoke-teacher-link.controller.js';

export const makeRevokeTeacherLinkController = (): RevokeTeacherLinkController =>
  new RevokeTeacherLinkController(new RevokeTeacherLinkUseCase(new TeacherLinkRepository(db.core)));
