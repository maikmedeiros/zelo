import { db } from '@config/database.js';
import { storage } from '@config/storage.js';
import { FindPhotoUseCase } from '@modules/application/use-cases/people/photo/find-photo/find-photo.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { FindPhotoController } from '@modules/presentation/controllers/people/photo/find-photo/find-photo.controller.js';

export const makeFindPhotoController = (): FindPhotoController =>
  new FindPhotoController(new FindPhotoUseCase(new PersonRepository(db.core), storage));
