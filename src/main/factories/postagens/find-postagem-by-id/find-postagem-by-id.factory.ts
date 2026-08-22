import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { FindPostagemByIdUseCase } from '@modules/application/use-cases/postagens/find-postagem-by-id/find-postagem-by-id.usecase.js';
import { PostagemRepository } from '@modules/infra/repositories/postagem.repository.js';
import { FindPostagemByIdController } from '@modules/presentation/controllers/postagens/find-postagem-by-id/find-postagem-by-id.controller.js';

export const makeFindPostagemByIdController = (): FindPostagemByIdController => {
  const postagemRepo = new PostagemRepository(db.core, env.publicUrl);
  const usecase = new FindPostagemByIdUseCase(postagemRepo, env.publicUrl);

  return new FindPostagemByIdController(usecase);
};
