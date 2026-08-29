import {
  ITeacherRepository,
  ListTeachersFilters,
  ListTeachersResult,
} from '../../../../domain/repositories/i-teacher-repository.js';

export class FindListTeachersUseCase {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  execute(filters: ListTeachersFilters): Promise<ListTeachersResult> {
    return this.teacherRepo.list(filters);
  }
}
