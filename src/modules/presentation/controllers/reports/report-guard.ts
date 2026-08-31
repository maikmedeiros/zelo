import { Actor } from '@shared/auth/index.js';
import { ReportOwnership } from '../../../domain/entities/report.js';
import { Can } from '../posts/post-guard.js';

export const makeReportGuard =
  (can: Can, actor: Actor, feature: string) =>
  (ownership: ReportOwnership): boolean =>
    can(actor, feature, { ownerId: ownership.authorId, groupId: ownership.classId });
