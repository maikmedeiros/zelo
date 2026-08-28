import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreatePostInput } from '../../../../application/dtos/posts/create-post/input.js';
import { CreatePostOutput } from '../../../../application/dtos/posts/create-post/output.js';
import { PostMapper } from '../../../../application/mappers/posts/post-mapper.js';
import { CreatePostUseCase } from '../../../../application/use-cases/posts/create-post/create-post.usecase.js';

export class CreatePostController {
  constructor(private readonly useCase: CreatePostUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreatePostOutput>> {
    const { actor } = request.context;
    const input = request.body as CreatePostInput;

    // A autoria sai do ator, nunca do corpo: aceitar `authorId` do cliente seria deixar
    // qualquer um assinar em nome de outro.
    const post = await this.useCase.execute({
      authorId: actor.id,
      audience: input.audience,
      classIds: input.classIds,
      studentIds: input.studentIds,
      type: input.type,
      title: input.title,
      body: input.body,
      referenceDate: input.referenceDate ?? null,
    });

    return { statusCode: 201, body: PostMapper.toOutput(post) };
  }
}
