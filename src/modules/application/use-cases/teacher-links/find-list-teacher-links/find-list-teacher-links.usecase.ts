import {
  ITeacherLinkRepository,
  ListTeacherLinksFilters,
  ListTeacherLinksResult,
} from '../../../../domain/repositories/i-teacher-link-repository.js';

export class FindListTeacherLinksUseCase {
  constructor(private readonly linkRepo: ITeacherLinkRepository) {}

  execute(filters: ListTeacherLinksFilters): Promise<ListTeacherLinksResult> {
    return this.linkRepo.list(filters);
  }
}
