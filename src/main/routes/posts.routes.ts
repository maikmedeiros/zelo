import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreatePostController,
  makeDeletePostController,
  makeFindListPostsController,
  makeFindPostByIdController,
  makePublishPostController,
  makeUpdatePostController,
} from '@main/factories/posts/index.js';
import {
  createPostValidator,
  deletePostValidator,
  findListPostsValidator,
  findPostByIdValidator,
  publishPostValidator,
  updatePostValidator,
} from '@modules/presentation/validators/posts/index.js';

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
