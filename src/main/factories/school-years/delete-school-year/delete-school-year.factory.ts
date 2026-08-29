import { db } from '@config/database.js';
import { DeleteSchoolYearUseCase } from '@modules/application/use-cases/school-years/delete-school-year/delete-school-year.usecase.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { DeleteSchoolYearController } from '@modules/presentation/controllers/school-years/delete-school-year/delete-school-year.controller.js';

export const makeDeleteSchoolYearController = (): DeleteSchoolYearController =>
  new DeleteSchoolYearController(new DeleteSchoolYearUseCase(new SchoolYearRepository(db.core)));
