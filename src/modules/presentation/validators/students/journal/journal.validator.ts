import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createJournalEntrySchema } from '../../../../application/dtos/students/journal/create-journal-entry/input.js';
import { deleteJournalEntrySchema } from '../../../../application/dtos/students/journal/delete-journal-entry/input.js';
import {
  findListJournalEntriesSchema,
  journalEntryParamsSchema,
  journalParamsSchema,
} from '../../../../application/dtos/students/journal/find-list-journal-entries/input.js';
import { updateJournalEntrySchema } from '../../../../application/dtos/students/journal/update-journal-entry/input.js';

export const findListJournalEntriesValidator: RequestHandler = (req, _res, next) => {
  const params = journalParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const query = findListJournalEntriesSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};

export const createJournalEntryValidator: RequestHandler = (req, _res, next) => {
  const params = journalParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = createJournalEntrySchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};

export const updateJournalEntryValidator: RequestHandler = (req, _res, next) => {
  const params = journalEntryParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateJournalEntrySchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};

export const deleteJournalEntryValidator: RequestHandler = (req, _res, next) => {
  const params = journalEntryParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = deleteJournalEntrySchema.safeParse(req.body ?? {});
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
