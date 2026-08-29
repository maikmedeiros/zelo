import { Class, ClassShift } from '../entities/class.js';
import { PageInfo } from './pagination.js';

export interface ListClassesFilters {
  page: number;
  limit: number;
  schoolYearId: string | null;
  shift: ClassShift | null;
  /** A escola sai do ator, nunca do cliente. */
  actorId: string;
  // `null` é o ator de abrangência ESCOLA, para quem o recorte de turma não se aplica.
  // Quem decide isso é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListClassesResult {
  items: Class[];
  pagination: PageInfo;
}

export interface CreateClassData {
  schoolYearId: string;
  name: string;
  segment: string;
  shift: ClassShift;
  actorId: string;
}

export interface UpdateClassData {
  name?: string;
  segment?: string;
  shift?: ClassShift;
}

export interface IClassRepository {
  list(filters: ListClassesFilters): Promise<ListClassesResult>;

  /** `viewerId` null dispensa o recorte de turma (abrangência ESCOLA, ou releitura após
   * uma escrita já autorizada). */
  findById(classId: string, actorId: string, viewerId: string | null): Promise<Class | null>;

  /** `null` quando (ano letivo, nome, turno) já existe — o índice único recusou a linha. */
  create(data: CreateClassData): Promise<string | null>;

  /** `false` quando o novo (nome, turno) colide com outra turma do mesmo ano letivo. */
  update(classId: string, data: UpdateClassData): Promise<boolean>;

  /** `false` quando a turma já foi usada — matrícula, vínculo ou postagem. */
  delete(classId: string): Promise<boolean>;
}
