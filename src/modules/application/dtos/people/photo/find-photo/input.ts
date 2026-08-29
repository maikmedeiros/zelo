import { z } from 'zod';

// `z.guid()`, nunca `z.uuid()`: o Zod 4 valida os nibbles da RFC 4122 e recusaria os UUIDs
// sentinela do projeto.
export const personPhotoParamsSchema = z.object({
  personId: z.guid(),
});

export type PersonPhotoParams = z.infer<typeof personPhotoParamsSchema>;
