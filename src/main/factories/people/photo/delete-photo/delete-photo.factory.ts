import { db } from '@config/database.js';
import { DeletePhotoUseCase } from '@modules/application/use-cases/people/photo/delete-photo/delete-photo.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { DeletePhotoController } from '@modules/presentation/controllers/people/photo/delete-photo/delete-photo.controller.js';

export const makeDeletePhotoController = (): DeletePhotoController =>
  new DeletePhotoController(new DeletePhotoUseCase(new PersonRepository(db.core)));
