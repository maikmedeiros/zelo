import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '@shared/utils/cpf/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';

// O CPF é opcional aqui de propósito: criança sem CPF é a regra, e exigir aqui impediria
// cadastrar aluno. Quem exige é o papel adulto (`POST /guardians`, `POST /teachers`), onde a
// duplicata custa caro — sem CPF preenchido o índice `uq_pessoa_cpf` não protege nada,
// porque no PostgreSQL NULL não colide com NULL.
export const createPersonSchema = z.strictObject({
  name: z.string().trim().min(1).max(200).transform(formatPersonName),
  socialName: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .transform(formatPersonName)
    .nullable()
    .default(null),
  birthDate: z.iso.date().nullable().default(null),
  cpf: z
    .string()
    .transform(normalizeCpf)
    .refine(isValidCpf, { message: 'CPF inválido' })
    .nullable()
    .default(null),
  phone: z.string().trim().min(8).max(20).nullable().default(null),
  contactEmail: z.email().max(255).nullable().default(null),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
