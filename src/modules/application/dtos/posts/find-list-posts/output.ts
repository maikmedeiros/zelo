import { PostType } from '../../../../domain/entities/post.js';

export interface FindListPostsOutput {
  id: string;
  classId: string;
  className: string;
  authorId: string;
  authorName: string;
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string;
  publishedAt: string;
}
