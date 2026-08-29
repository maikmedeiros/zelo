import { Router } from 'express';
import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { controller } from '@shared/adapters/index.js';
import {
  makeCreateUserController,
  makeDeleteUserController,
  makeFindListUsersController,
  makeFindUserByIdController,
  makeUpdateUserController,
} from '@main/factories/users/index.js';
import {
  createUserValidator,
  deleteUserValidator,
  findListUsersValidator,
  findUserByIdValidator,
  updateUserValidator,
} from '@modules/presentation/validators/users/index.js';

// `DELETE /users/:userId` **desativa** — não apaga. O usuário é autor de postagem e quem
// registrou consentimento, referências ON DELETE RESTRICT: remover a linha exigiria remover
// o histórico junto. A desativação encerra sessões e revoga tokens, que é o efeito prático
// esperado de "tirar o acesso".
export default (router: Router): void => {
  router.get(
    '/users',
    authz.canRequest(Feature.UserView),
    findListUsersValidator,
    controller(makeFindListUsersController()),
  );

  router.post(
    '/users',
    authz.canRequest(Feature.UserCreate),
    createUserValidator,
    controller(makeCreateUserController()),
  );

  router.get(
    '/users/:userId',
    authz.canRequest(Feature.UserView),
    findUserByIdValidator,
    controller(makeFindUserByIdController()),
  );

  router.patch(
    '/users/:userId',
    authz.canRequest(Feature.UserUpdate),
    updateUserValidator,
    controller(makeUpdateUserController()),
  );

  router.delete(
    '/users/:userId',
    authz.canRequest(Feature.UserDelete),
    deleteUserValidator,
    controller(makeDeleteUserController()),
  );
};
