import { db } from '@config/database.js';
import { CreateTeacherUseCase } from '@modules/application/use-cases/teachers/create-teacher/create-teacher.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { TeacherRepository } from '@modules/infra/repositories/teacher.repository.js';
import { CreateTeacherController } from '@modules/presentation/controllers/teachers/create-teacher/create-teacher.controller.js';

export const makeCreateTeacherController = (): CreateTeacherController =>
  new CreateTeacherController(
    new CreateTeacherUseCase(new TeacherRepository(db.core), new PersonRepository(db.core)),
  );
