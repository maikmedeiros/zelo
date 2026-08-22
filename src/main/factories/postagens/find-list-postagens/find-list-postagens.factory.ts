import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { FindListPostagensUseCase } from '@modules/application/use-cases/postagens/find-list-postagens/find-list-postagens.usecase.js';
import { PostagemRepository } from '@modules/infra/repositories/postagem.repository.js';
import { FindListPostagensController } from '@modules/presentation/controllers/postagens/find-list-postagens/find-list-postagens.controller.js';

export const makeFindListPostagensController = (): FindListPostagensController => {
  const postagemRepo = new PostagemRepository(db.core, env.publicUrl);
  const usecase = new FindListPostagensUseCase(postagemRepo);

  return new FindListPostagensController(usecase);
};
