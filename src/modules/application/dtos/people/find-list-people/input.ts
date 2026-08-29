import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '@shared/utils/cpf/index.js';
import { PERSON_ROLES } from '../../../../domain/entities/person.js';

// `none` é o filtro que fecha o ciclo do cadastro em duas etapas: encontra exatamente as
// pessoas que ficaram sem papel porque a segunda chamada não veio.
const ROLE_FILTERS = [...PERSON_ROLES, 'none'] as const;

export const findListPeopleSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Aceita com máscara ou sem: o operador copia e cola do documento.
  cpf: z
    .string()
    .transform(normalizeCpf)
    .refine(isValidCpf, { message: 'CPF inválido' })
    .optional(),
  search: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ROLE_FILTERS).optional(),
});

export type FindListPeopleInput = z.infer<typeof findListPeopleSchema>;
