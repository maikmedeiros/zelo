import { db } from '@config/database.js';
import { RevokeClassAccessUseCase } from '@modules/application/use-cases/class-accesses/revoke-class-access/revoke-class-access.usecase.js';
import { ClassAccessRepository } from '@modules/infra/repositories/class-access.repository.js';
import { RevokeClassAccessController } from '@modules/presentation/controllers/class-accesses/revoke-class-access/revoke-class-access.controller.js';

export const makeRevokeClassAccessController = (): RevokeClassAccessController =>
  new RevokeClassAccessController(new RevokeClassAccessUseCase(new ClassAccessRepository(db.core)));
