import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteJournalEntryInput } from '../../../../../application/dtos/students/journal/delete-journal-entry/input.js';
import { journalEntryParamsSchema } from '../../../../../application/dtos/students/journal/find-list-journal-entries/input.js';
import { DeleteJournalEntryUseCase } from '../../../../../application/use-cases/students/journal/delete-journal-entry/delete-journal-entry.usecase.js';
import { makeJournalGuard } from '../journal-guard.js';

export class DeleteJournalEntryController {
  constructor(private readonly useCase: DeleteJournalEntryUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { studentId, entryId } = journalEntryParamsSchema.parse(request.params);
    const input = (request.body ?? {}) as DeleteJournalEntryInput;

    await this.useCase.execute({
      entryId,
      studentId,
      actorId: actor.id,
      reason: input.reason ?? null,
      guard: makeJournalGuard(authz.can, actor, Feature.JournalDelete),
    });

    return { statusCode: 204 };
  }
}
