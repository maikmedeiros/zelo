import { db } from '@config/database.js';
import { UpdateSchoolYearUseCase } from '@modules/application/use-cases/school-years/update-school-year/update-school-year.usecase.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { UpdateSchoolYearController } from '@modules/presentation/controllers/school-years/update-school-year/update-school-year.controller.js';

export const makeUpdateSchoolYearController = (): UpdateSchoolYearController =>
  new UpdateSchoolYearController(new UpdateSchoolYearUseCase(new SchoolYearRepository(db.core)));
