import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateClassAccessInput } from '../../../../application/dtos/class-accesses/create-class-access/input.js';
import { CreateClassAccessOutput } from '../../../../application/dtos/class-accesses/create-class-access/output.js';
import { ClassAccessMapper } from '../../../../application/mappers/class-accesses/class-access-mapper.js';
import { CreateClassAccessUseCase } from '../../../../application/use-cases/class-accesses/create-class-access/create-class-access.usecase.js';

export class CreateClassAccessController {
  constructor(private readonly useCase: CreateClassAccessUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateClassAccessOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateClassAccessInput;

    // `grantedBy` sai do ator, nunca do corpo: quem concedeu o acesso tem de ficar
    // registrado com o próprio id — é o que dá sentido à trilha de auditoria.
    const access = await this.useCase.execute({
      userId: input.userId,
      classId: input.classId,
      reason: input.reason,
      justification: input.justification,
      startDate: input.startDate ?? null,
      grantedBy: actor.id,
      actorId: actor.id,
    });

    return { statusCode: 201, body: ClassAccessMapper.toOutput(access) };
  }
}
