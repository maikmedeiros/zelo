import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { ValidationError } from '@shared/errors/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { personPhotoParamsSchema } from '../../../../../application/dtos/people/photo/find-photo/input.js';
import { UpdatePhotoOutput } from '../../../../../application/dtos/people/photo/update-photo/output.js';
import { UpdatePhotoUseCase } from '../../../../../application/use-cases/people/photo/update-photo/update-photo.usecase.js';

export class UpdatePhotoController {
  constructor(private readonly useCase: UpdatePhotoUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdatePhotoOutput>> {
    const { actor } = request.context;
    const { personId } = personPhotoParamsSchema.parse(request.params);

    // O multer já rodou; sem arquivo, o corpo veio errado — é 400 de validação, não 422.
    const file = request.file;
    if (!file) {
      throw new ValidationError({
        cause: [
          { path: ['file'], message: 'Envie a imagem no campo `file` (multipart/form-data)' },
        ],
      });
    }

    // Sem ESCOLA, só a própria foto. O salto de `usuario.id` para `pessoa.id` é feito no SQL.
    const ownOnly = !authz.scopesOf(actor, Feature.PhotoUpdate).includes('ESCOLA');

    const output = await this.useCase.execute({
      personId,
      originalName: file.originalname,
      content: file.buffer,
      actorId: actor.id,
      ownOnly,
    });

    return { statusCode: 200, body: output };
  }
}
