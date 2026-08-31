import { Consent, ConsentOrigin, ConsentType } from '../entities/consent.js';
import { PageInfo } from './pagination.js';

export interface ListConsentsFilters {
  page: number;
  limit: number;
  studentId: string;
  type: ConsentType | null;
  current: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListConsentsResult {
  items: Consent[];
  pagination: PageInfo;
}

export interface CreateConsentData {
  studentId: string;
  type: ConsentType;
  granted: boolean;
  origin: ConsentOrigin;
  recordedBy: string;
  guardianId: string | null;
  documentKey: string | null;
  note: string | null;
}

export interface IConsentRepository {
  list(filters: ListConsentsFilters): Promise<ListConsentsResult>;
  findById(
    consentId: string,
    studentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Consent | null>;

  create(data: CreateConsentData): Promise<Consent>;
  revoke(consentId: string, studentId: string): Promise<boolean>;
}
