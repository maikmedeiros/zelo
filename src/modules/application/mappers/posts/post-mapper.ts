import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import {
  Post,
  PostAudience,
  PostClass,
  PostStudent,
  PostType,
} from '../../../domain/entities/post.js';

interface ClassRow {
  ID: string;
  NOME: string;
}

interface StudentRow {
  ID: string;
  NOME: string;
  TURMA_ID: string | null;
  NOME_TURMA: string | null;
}

export interface PostOutput {
  id: string;
  audience: PostAudience;
  classes: PostClass[];
  students: PostStudent[];
  authorId: string;
  authorName: string;
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string;
  publishedAt: string;
}

export interface PostPersistenceRow extends PaginatedRow {
  ID: string;
  DESTINATARIO: PostAudience;
  TURMAS: ClassRow[] | null;
  ALUNOS: StudentRow[] | null;
  AUTOR_ID: string;
  NOME_AUTOR: string;
  TIPO: PostType;
  TITULO: string | null;
  CORPO: string | null;
  REFERENTE_A: string;
  PUBLICADO_EM: Date;
}

const toClass = (row: ClassRow): PostClass => ({ id: row.ID, name: row.NOME });

const toStudent = (row: StudentRow): PostStudent => ({
  id: row.ID,
  name: formatPersonName(row.NOME),
  classId: row.TURMA_ID,
  className: row.NOME_TURMA,
});

export class PostMapper {
  static fromPersistence(row: PostPersistenceRow): Post {
    return {
      id: row.ID,
      audience: row.DESTINATARIO,
      classes: (row.TURMAS ?? []).map(toClass),
      students: (row.ALUNOS ?? []).map(toStudent),
      authorId: row.AUTOR_ID,
      authorName: formatPersonName(row.NOME_AUTOR),
      type: row.TIPO,
      title: row.TITULO,
      body: row.CORPO,
      referenceDate: row.REFERENTE_A,
      publishedAt: row.PUBLICADO_EM,
    };
  }

  static toOutput(post: Post): PostOutput {
    return { ...post, publishedAt: post.publishedAt.toISOString() };
  }
}
