import { db } from '@config/database.js';
import { CreateTeacherLinkUseCase } from '@modules/application/use-cases/teacher-links/create-teacher-link/create-teacher-link.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { TeacherLinkRepository } from '@modules/infra/repositories/teacher-link.repository.js';
import { TeacherRepository } from '@modules/infra/repositories/teacher.repository.js';
import { CreateTeacherLinkController } from '@modules/presentation/controllers/teacher-links/create-teacher-link/create-teacher-link.controller.js';

export const makeCreateTeacherLinkController = (): CreateTeacherLinkController =>
  new CreateTeacherLinkController(
    new CreateTeacherLinkUseCase(
      new TeacherLinkRepository(db.core),
      new TeacherRepository(db.core),
      new ClassRepository(db.core),
    ),
  );
