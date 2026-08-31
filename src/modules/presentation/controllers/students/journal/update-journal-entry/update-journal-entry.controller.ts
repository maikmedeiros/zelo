import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { journalEntryParamsSchema } from '../../../../../application/dtos/students/journal/find-list-journal-entries/input.js';
import { UpdateJournalEntryInput } from '../../../../../application/dtos/students/journal/update-journal-entry/input.js';
import {
  JournalEntryMapper,
  JournalEntryOutput,
} from '../../../../../application/mappers/students/journal/journal-entry-mapper.js';
import { UpdateJournalEntryUseCase } from '../../../../../application/use-cases/students/journal/update-journal-entry/update-journal-entry.usecase.js';
import { makeJournalGuard } from '../journal-guard.js';

export class UpdateJournalEntryController {
  constructor(private readonly useCase: UpdateJournalEntryUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<JournalEntryOutput>> {
    const { actor } = request.context;
    const { studentId, entryId } = journalEntryParamsSchema.parse(request.params);
    const input = request.body as UpdateJournalEntryInput;

    const viewerId = authz.scopesOf(actor, Feature.JournalUpdate).includes('ESCOLA')
      ? null
      : actor.id;

    const entry = await this.useCase.execute({
      entryId,
      studentId,
      text: input.text,
      actorId: actor.id,
      viewerId,
      guard: makeJournalGuard(authz.can, actor, Feature.JournalUpdate),
    });

    return { statusCode: 200, body: JournalEntryMapper.toOutput(entry) };
  }
}
