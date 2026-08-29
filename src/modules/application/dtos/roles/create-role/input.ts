import { z } from 'zod';
import { SCOPES } from '@shared/auth/index.js';
import { Feature } from '@config/features.js';

// A capability é validada contra o **enum**, não contra texto livre: um código inexistente
// vira 400 aqui, antes de chegar ao banco. O repositório confere de novo contra `PERMISSAO`,
// porque as duas listas podem divergir — é o que o `assertFeaturesInSync` do boot vigia.
export const permissionSchema = z.strictObject({
  code: z.enum(Object.values(Feature)),
  scope: z.enum(SCOPES),
});

// `system` não é campo do corpo: perfil de sistema nasce de migration, nunca da API.
export const createRoleSchema = z.strictObject({
  // `toUpperCase` antes do `regex`: o código é normalizado e só depois conferido, então
  // `secretaria` vira `SECRETARIA` e passa, enquanto `nao vale` continua sendo 400.
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Use MAIÚSCULAS_COM_UNDERSCORE'),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000).nullable().default(null),
  permissions: z.array(permissionSchema).default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
