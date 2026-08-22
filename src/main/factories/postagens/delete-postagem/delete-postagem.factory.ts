import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { DeletePostagemUseCase } from '@modules/application/use-cases/postagens/delete-postagem/delete-postagem.usecase.js';
import { PostagemRepository } from '@modules/infra/repositories/postagem.repository.js';
import { DeletePostagemController } from '@modules/presentation/controllers/postagens/delete-postagem/delete-postagem.controller.js';

export const makeDeletePostagemController = (): DeletePostagemController => {
  const postagemRepo = new PostagemRepository(db.core, env.publicUrl);
  const usecase = new DeletePostagemUseCase(postagemRepo);

  return new DeletePostagemController(usecase);
};
