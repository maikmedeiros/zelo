import { Router } from 'express';
import authz from '@config/authz.js';
import { env } from '@config/env.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import { singleFile } from '@shared/middlewares/index.js';
import {
  makeCreateMediaController,
  makeCreatePostController,
  makeDeleteMediaController,
  makeDeletePostController,
  makeFindListMediaController,
  makeFindListPostsController,
  makeFindMediaByIdController,
  makeFindPostByIdController,
  makePublishPostController,
  makeUpdatePostController,
} from '@main/factories/posts/index.js';
import {
  createPostValidator,
  deletePostValidator,
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
