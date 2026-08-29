import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  ReactionMapper,
  ReactionTypeOutput,
} from '../../../../application/mappers/posts/reactions/reaction-mapper.js';
import { FindListReactionTypesUseCase } from '../../../../application/use-cases/reaction-types/find-list-reaction-types/find-list-reaction-types.usecase.js';

export class FindListReactionTypesController {
  constructor(private readonly useCase: FindListReactionTypesUseCase) {}

  async handle(_request: IHttpRequest): Promise<IHttpResponse<{ results: ReactionTypeOutput[] }>> {
    const items = await this.useCase.execute();

    // Sem envelope de paginação: são três linhas fixas, e prometer `page` num catálogo que
    // nunca cresce seria ruído.
    return { statusCode: 200, body: { results: items.map(ReactionMapper.typeToOutput) } };
  }
}
