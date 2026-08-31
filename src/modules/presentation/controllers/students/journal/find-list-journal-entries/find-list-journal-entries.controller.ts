import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  findListJournalEntriesSchema,
  journalParamsSchema,
} from '../../../../../application/dtos/students/journal/find-list-journal-entries/input.js';
import {
  JournalEntryMapper,
  JournalEntryOutput,
} from '../../../../../application/mappers/students/journal/journal-entry-mapper.js';
import { FindListJournalEntriesUseCase } from '../../../../../application/use-cases/students/journal/find-list-journal-entries/find-list-journal-entries.usecase.js';

export class FindListJournalEntriesController {
  constructor(private readonly useCase: FindListJournalEntriesUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<JournalEntryOutput>>> {
    const { actor } = request.context;
    const { studentId } = journalParamsSchema.parse(request.params);
    const query = findListJournalEntriesSchema.parse(request.query);

    const viewerId = authz.scopesOf(actor, Feature.JournalView).includes('ESCOLA')
      ? null
      : actor.id;

    const { items, pagination } = await this.useCase.execute({
      studentId,
      page: query.page,
      limit: query.limit,
      referenceDate: query.date ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 200, body: paginated(items.map(JournalEntryMapper.toOutput), pagination) };
  }
}
