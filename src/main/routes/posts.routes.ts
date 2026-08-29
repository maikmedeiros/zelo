import { Router } from 'express';
import authz from '@config/authz.js';
import { env } from '@config/env.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import { singleFile } from '@shared/middlewares/index.js';
import {
  makeCreateCommentController,
  makeCreateMediaController,
  makeCreatePostController,
  makeDeleteCommentController,
  makeDeleteMediaController,
  makeDeletePostController,
  makeFindListCommentsController,
  makeFindListMediaController,
  makeFindListPostsController,
  makeFindMediaByIdController,
  makeFindPostByIdController,
  makePublishPostController,
  makeUpdatePostController,
} from '@main/factories/posts/index.js';
import {
  createCommentValidator,
  createPostValidator,
  deleteCommentValidator,
  deletePostValidator,
  findListCommentsValidator,
  findListPostsValidator,
  findPostByIdValidator,
  mediaItemValidator,
  postMediaValidator,
  publishPostValidator,
  updatePostValidator,
} from '@modules/presentation/validators/posts/index.js';

// O multer entra ENTRE a autorização e o validator: antes dele o corpo multipart ainda não
// foi lido, e antes do `canRequest` o servidor gastaria upload de quem nem podia pedir.
const uploadMedia = singleFile('file', { maxFileSizeBytes: env.storage.maxFileSizeBytes });

export default (router: Router): void => {
  router.get(
    '/posts',
    authz.canRequest(Feature.PostView),
    findListPostsValidator,
    controller(makeFindListPostsController()),
  );

  router.post(
    '/posts',
    authz.canRequest(Feature.PostCreate),
    createPostValidator,
    controller(makeCreatePostController()),
  );

  // Antes da rota de param, como manda o CLAUDE.md §5.
  router.post(
    '/posts/:postId/publication',
    authz.canRequest(Feature.PostPublish),
    publishPostValidator,
    controller(makePublishPostController()),
  );

  router.get(
    '/posts/:postId/comments',
    authz.canRequest(Feature.CommentView),
    findListCommentsValidator,
    controller(makeFindListCommentsController()),
  );

  router.post(
    '/posts/:postId/comments',
    authz.canRequest(Feature.CommentCreate),
    createCommentValidator,
    controller(makeCreateCommentController()),
  );

  router.delete(
    '/posts/:postId/comments/:commentId',
    authz.canRequest(Feature.CommentDelete),
    deleteCommentValidator,
    controller(makeDeleteCommentController()),
  );

  router.get(
    '/posts/:postId/media',
    authz.canRequest(Feature.MediaView),
    postMediaValidator,
    controller(makeFindListMediaController()),
  );

  router.post(
    '/posts/:postId/media',
    authz.canRequest(Feature.MediaCreate),
    uploadMedia,
    postMediaValidator,
    controller(makeCreateMediaController()),
  );

  router.get(
    '/posts/:postId/media/:mediaId',
    authz.canRequest(Feature.MediaView),
    mediaItemValidator,
    controller(makeFindMediaByIdController()),
  );

  router.delete(
    '/posts/:postId/media/:mediaId',
    authz.canRequest(Feature.MediaDelete),
    mediaItemValidator,
    controller(makeDeleteMediaController()),
  );

  router.get(
    '/posts/:postId',
    authz.canRequest(Feature.PostView),
    findPostByIdValidator,
    controller(makeFindPostByIdController()),
  );

  router.patch(
    '/posts/:postId',
    authz.canRequest(Feature.PostUpdate),
    updatePostValidator,
    controller(makeUpdatePostController()),
  );

  router.delete(
    '/posts/:postId',
    authz.canRequest(Feature.PostDelete),
    deletePostValidator,
    controller(makeDeletePostController()),
  );
};
