import { Actor } from '@shared/auth/index.js';
import { ReportTemplateOwnership } from '../../../domain/entities/report-template.js';
import { Can } from '../posts/post-guard.js';

export const makeTemplateGuard =
  (can: Can, actor: Actor, feature: string) =>
  (ownership: ReportTemplateOwnership): boolean =>
    can(actor, feature, { ownerId: ownership.authorId });
