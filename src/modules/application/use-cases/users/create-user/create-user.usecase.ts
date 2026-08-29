import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { hashPassword } from '@shared/utils/password/index.js';
import { UserAccount } from '../../../../domain/entities/user.js';
import { IPersonRepository } from '../../../../domain/repositories/i-person-repository.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export interface CreateUserInputData {
  personId: string;
  email: string;
  password: string;
  actorId: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly personRepo: IPersonRepository,
  ) {}

  async execute(data: CreateUserInputData): Promise<UserAccount> {
    const person = await this.personRepo.findById(data.personId, data.actorId, null);
    if (!person) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    // A senha nunca sai daqui em claro: o cliente a define, o argon2id a transforma, e só o
    // hash chega ao repositório.
    const passwordHash = await hashPassword(data.password);

    const userId = await this.userRepo.create({
      personId: data.personId,
      email: data.email,
      passwordHash,
      actorId: data.actorId,
    });

    // Dois índices únicos podem ter recusado a linha, e o operador precisa saber qual:
    // "esta pessoa já tem login" e "este e-mail é de outra pessoa" pedem correções opostas.
    if (!userId) throw await this.conflito(data.personId, data.email);

    const user = await this.userRepo.findById(userId, data.actorId, null);
    if (!user) throw new InternalServerError({ message: 'Usuário gravado mas não relido' });

    return user;
  }

  private async conflito(personId: string, email: string): Promise<ConflictError> {
    const existingByPerson = await this.userRepo.findIdByPersonId(personId);
    if (existingByPerson) {
      return new ConflictError({
        message: 'Esta pessoa já tem login',
        cause: { userId: existingByPerson },
      });
    }

    const existingByEmail = await this.userRepo.findIdByEmail(email);

    return new ConflictError({
      message: 'Este e-mail já está em uso',
      cause: { email, userId: existingByEmail },
    });
  }
}
