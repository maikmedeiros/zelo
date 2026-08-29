import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindTeacherByIdUseCase } from '@modules/application/use-cases/teachers/find-teacher-by-id/find-teacher-by-id.usecase.js';
import { TeacherRepository } from '@modules/infra/repositories/teacher.repository.js';
import { FindTeacherByIdController } from '@modules/presentation/controllers/teachers/find-teacher-by-id/find-teacher-by-id.controller.js';

export const makeFindTeacherByIdController = (): FindTeacherByIdController =>
  new FindTeacherByIdController(
    new FindTeacherByIdUseCase(new TeacherRepository(db.core)),
    authz.scopesOf,
  );
