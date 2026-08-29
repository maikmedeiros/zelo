import { z } from 'zod';
import { isValidCpf, normalizeCpf } from '@shared/utils/cpf/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';

export const updatePersonParamsSchema = z.object({
  personId: z.guid(),
});

// Anuláveis de propósito: apagar um telefone errado é uma correção legítima. O `name` é o
// único que não aceita `null` — pessoa sem nome não é cadastro, é ruído.
export const updatePersonSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(200).transform(formatPersonName).optional(),
    socialName: z.string().trim().min(1).max(200).transform(formatPersonName).nullable().optional(),
    birthDate: z.iso.date().nullable().optional(),
    cpf: z
      .string()
      .transform(normalizeCpf)
      .refine(isValidCpf, { message: 'CPF inválido' })
      .nullable()
      .optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
    contactEmail: z.email().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
