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

export interface ConsentAuthority {
  guardianId: string;
  guardianName: string;
  canConsent: boolean;
}

export interface UpdateGuardianLinkData {
  relationship?: Relationship;
  canConsent?: boolean;
  financial?: boolean;
}

export interface IGuardianLinkRepository {
  list(filters: ListGuardianLinksFilters): Promise<ListGuardianLinksResult>;
  findById(linkId: string, actorId: string, viewerId: string | null): Promise<GuardianLink | null>;

  findConsentAuthority(studentId: string, actorId: string): Promise<ConsentAuthority | null>;

  findAuthorityOf(studentId: string, guardianId: string): Promise<ConsentAuthority | null>;

  create(data: CreateGuardianLinkData): Promise<string | null>;
  update(linkId: string, data: UpdateGuardianLinkData): Promise<boolean>;

  revoke(linkId: string): Promise<boolean>;
}
