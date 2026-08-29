import { db } from '@config/database.js';
import { FindListSchoolYearsUseCase } from '@modules/application/use-cases/school-years/find-list-school-years/find-list-school-years.usecase.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { FindListSchoolYearsController } from '@modules/presentation/controllers/school-years/find-list-school-years/find-list-school-years.controller.js';

export const makeFindListSchoolYearsController = (): FindListSchoolYearsController =>
  new FindListSchoolYearsController(
    new FindListSchoolYearsUseCase(new SchoolYearRepository(db.core)),
  );
