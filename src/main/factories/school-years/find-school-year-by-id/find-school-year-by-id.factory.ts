import { db } from '@config/database.js';
import { FindSchoolYearByIdUseCase } from '@modules/application/use-cases/school-years/find-school-year-by-id/find-school-year-by-id.usecase.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { FindSchoolYearByIdController } from '@modules/presentation/controllers/school-years/find-school-year-by-id/find-school-year-by-id.controller.js';

export const makeFindSchoolYearByIdController = (): FindSchoolYearByIdController =>
  new FindSchoolYearByIdController(
    new FindSchoolYearByIdUseCase(new SchoolYearRepository(db.core)),
  );
