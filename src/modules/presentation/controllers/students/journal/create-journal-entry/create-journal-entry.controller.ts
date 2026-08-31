import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateJournalEntryInput } from '../../../../../application/dtos/students/journal/create-journal-entry/input.js';
import { journalParamsSchema } from '../../../../../application/dtos/students/journal/find-list-journal-entries/input.js';
import {
  JournalEntryMapper,
  JournalEntryOutput,
} from '../../../../../application/mappers/students/journal/journal-entry-mapper.js';
import { CreateJournalEntryUseCase } from '../../../../../application/use-cases/students/journal/create-journal-entry/create-journal-entry.usecase.js';

export class CreateJournalEntryController {
  constructor(private readonly useCase: CreateJournalEntryUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<JournalEntryOutput>> {
    const { actor } = request.context;
    const { studentId } = journalParamsSchema.parse(request.params);
    const input = request.body as CreateJournalEntryInput;

    const viewerId = authz.scopesOf(actor, Feature.JournalCreate).includes('ESCOLA')
      ? null
      : actor.id;

    const entry = await this.useCase.execute({
      studentId,
      text: input.text,
      referenceDate: input.referenceDate ?? null,
      repliesToId: input.repliesToId ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 201, body: JournalEntryMapper.toOutput(entry) };
  }
}
