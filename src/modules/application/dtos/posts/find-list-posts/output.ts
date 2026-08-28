import {
  PostAudience,
  PostClass,
  PostStudent,
  PostType,
} from '../../../../domain/entities/post.js';

export interface FindListPostsOutput {
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
