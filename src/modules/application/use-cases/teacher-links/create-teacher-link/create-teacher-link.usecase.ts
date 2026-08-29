import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { TeacherLink } from '../../../../domain/entities/teacher-link.js';
import { IClassRepository } from '../../../../domain/repositories/i-class-repository.js';
import {
  CreateTeacherLinkData,
  ITeacherLinkRepository,
} from '../../../../domain/repositories/i-teacher-link-repository.js';
import { ITeacherRepository } from '../../../../domain/repositories/i-teacher-repository.js';

export interface CreateTeacherLinkInputData extends CreateTeacherLinkData {
  actorId: string;
}

export class CreateTeacherLinkUseCase {
  constructor(
    private readonly linkRepo: ITeacherLinkRepository,
    private readonly teacherRepo: ITeacherRepository,
    private readonly classRepo: IClassRepository,
  ) {}

  async execute(data: CreateTeacherLinkInputData): Promise<TeacherLink> {
    const teacher = await this.teacherRepo.findById(data.teacherId, data.actorId, null);
    if (!teacher) throw new NotFoundError({ message: 'Professor não encontrado' });

    const turma = await this.classRepo.findById(data.classId, data.actorId, null);
    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    const linkId = await this.linkRepo.create(data);
    if (!linkId) {
      throw new ConflictError({
        message: 'Este professor já tem vínculo vigente com esta turma',
        cause: { teacherId: data.teacherId, classId: data.classId },
      });
    }

    const link = await this.linkRepo.findById(linkId, data.actorId, null);
    if (!link) throw new InternalServerError({ message: 'Vínculo gravado mas não relido' });

    return link;
  }
}
