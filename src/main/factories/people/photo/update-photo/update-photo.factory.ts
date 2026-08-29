import { db } from '@config/database.js';
import { storage } from '@config/storage.js';
import { UpdatePhotoUseCase } from '@modules/application/use-cases/people/photo/update-photo/update-photo.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { UpdatePhotoController } from '@modules/presentation/controllers/people/photo/update-photo/update-photo.controller.js';

export const makeUpdatePhotoController = (): UpdatePhotoController =>
  new UpdatePhotoController(new UpdatePhotoUseCase(new PersonRepository(db.core), storage));
