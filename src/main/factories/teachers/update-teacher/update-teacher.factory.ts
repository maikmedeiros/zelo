import { db } from '@config/database.js';
import { UpdateTeacherUseCase } from '@modules/application/use-cases/teachers/update-teacher/update-teacher.usecase.js';
import { TeacherRepository } from '@modules/infra/repositories/teacher.repository.js';
import { UpdateTeacherController } from '@modules/presentation/controllers/teachers/update-teacher/update-teacher.controller.js';

export const makeUpdateTeacherController = (): UpdateTeacherController =>
  new UpdateTeacherController(new UpdateTeacherUseCase(new TeacherRepository(db.core)));
