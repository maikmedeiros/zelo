import { Actor } from '@shared/auth/index.js';
import { JournalEntryOwnership } from '../../../../domain/entities/journal-entry.js';
import { Can } from '../../posts/post-guard.js';

export const makeJournalGuard =
  (can: Can, actor: Actor, feature: string) =>
  (ownership: JournalEntryOwnership): boolean =>
    can(actor, feature, { ownerId: ownership.authorId, groupId: ownership.classId });
