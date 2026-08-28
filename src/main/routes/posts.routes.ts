import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeFindListPostsController,
  makeFindPostByIdController,
} from '@main/factories/posts/index.js';
import {
  findListPostsValidator,
  findPostByIdValidator,
} from '@modules/presentation/validators/posts/index.js';

export default (router: Router): void => {
  router.get(
    '/posts',
    authz.canRequest(Feature.PostView),
    findListPostsValidator,
    controller(makeFindListPostsController()),
  );

  router.get(
    '/posts/:postId',
    authz.canRequest(Feature.PostView),
    findPostByIdValidator,
    controller(makeFindPostByIdController()),
  );
};
