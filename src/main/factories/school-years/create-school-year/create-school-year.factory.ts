import { db } from '@config/database.js';
import { CreateSchoolYearUseCase } from '@modules/application/use-cases/school-years/create-school-year/create-school-year.usecase.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { CreateSchoolYearController } from '@modules/presentation/controllers/school-years/create-school-year/create-school-year.controller.js';

export const makeCreateSchoolYearController = (): CreateSchoolYearController =>
  new CreateSchoolYearController(new CreateSchoolYearUseCase(new SchoolYearRepository(db.core)));
