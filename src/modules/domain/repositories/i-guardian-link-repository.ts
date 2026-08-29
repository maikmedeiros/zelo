import { GuardianLink, Relationship } from '../entities/guardian-link.js';
import { PageInfo } from './pagination.js';

export interface ListGuardianLinksFilters {
  page: number;
  limit: number;
  guardianId: string | null;
  studentId: string | null;
  active: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListGuardianLinksResult {
  items: GuardianLink[];
  pagination: PageInfo;
}

export interface CreateGuardianLinkData {
  guardianId: string;
  studentId: string;
  relationship: Relationship;
  canConsent: boolean;
  financial: boolean;
  startDate: string | null;
}

export interface UpdateGuardianLinkData {
  relationship?: Relationship;
  canConsent?: boolean;
  financial?: boolean;
}

export interface IGuardianLinkRepository {
  list(filters: ListGuardianLinksFilters): Promise<ListGuardianLinksResult>;
  findById(linkId: string, actorId: string, viewerId: string | null): Promise<GuardianLink | null>;

  /** `null` quando já existe vínculo vigente entre este responsável e este aluno. */
  create(data: CreateGuardianLinkData): Promise<string | null>;
  update(linkId: string, data: UpdateGuardianLinkData): Promise<boolean>;

  /** `false` quando o vínculo já estava encerrado. */
  revoke(linkId: string): Promise<boolean>;
}
