import { z } from 'zod';
import { permissionSchema } from '../create-role/input.js';

export const updateRoleParamsSchema = z.object({
  roleId: z.guid(),
});

// `code` não é alterável: ele é a chave que o resto do sistema usa para falar do perfil, e
// trocá-lo em runtime quebraria qualquer referência por código.
//
// `permissions` **substitui** o conjunto inteiro. Não existe "acrescentar uma": sem a
// substituição não haveria como remover permissão de um perfil.
export const updateRoleSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    permissions: z.array(permissionSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
