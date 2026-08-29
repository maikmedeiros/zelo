export interface AppErrorParams {
  message?: string;
  cause?: unknown;
}

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly cause?: unknown;

  constructor(params: AppErrorParams = {}) {
    super(params.message ?? 'Erro inesperado');
    this.name = new.target.name;
    this.cause = params.cause;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Dados de entrada inválidos', cause: params.cause });
  }
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Credencial ausente ou inválida', cause: params.cause });
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Sem permissão para esta operação', cause: params.cause });
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Recurso não encontrado', cause: params.cause });
  }
}

export class MethodNotAllowedError extends AppError {
  readonly statusCode = 405;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Método não permitido', cause: params.cause });
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(params: AppErrorParams = {}) {
    super({
      message: params.message ?? 'Conflito com o estado atual do recurso',
      cause: params.cause,
    });
  }
}

export class PayloadTooLargeError extends AppError {
  readonly statusCode = 413;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Conteúdo maior que o limite', cause: params.cause });
  }
}

export class UnprocessableEntityError extends AppError {
  readonly statusCode = 422;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Regra de negócio violada', cause: params.cause });
  }
}

export class ServiceError extends AppError {
  readonly statusCode = 502;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Falha em serviço externo', cause: params.cause });
  }
}

export class InternalServerError extends AppError {
  readonly statusCode = 500;

  constructor(params: AppErrorParams = {}) {
    super({ message: params.message ?? 'Erro interno do servidor', cause: params.cause });
  }
}
