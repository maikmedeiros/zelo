import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { storage } from '@config/storage.js';
import { CreatePostagemUseCase } from '@modules/application/use-cases/postagens/create-postagem/create-postagem.usecase.js';
import { AlunoRepository } from '@modules/infra/repositories/aluno.repository.js';
import { PostagemRepository } from '@modules/infra/repositories/postagem.repository.js';
import { TurmaRepository } from '@modules/infra/repositories/turma.repository.js';
import { CreatePostagemController } from '@modules/presentation/controllers/postagens/create-postagem/create-postagem.controller.js';

export const makeCreatePostagemController = (): CreatePostagemController => {
  const postagemRepo = new PostagemRepository(db.core, env.publicUrl);
  const turmaRepo = new TurmaRepository(db.core);
  const alunoRepo = new AlunoRepository(db.core);

  const usecase = new CreatePostagemUseCase(postagemRepo, turmaRepo, alunoRepo, storage, db.core);

  return new CreatePostagemController(usecase);
};
