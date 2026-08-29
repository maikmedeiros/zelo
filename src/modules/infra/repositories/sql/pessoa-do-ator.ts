/**
 * A PESSOA por trás do ator, em SQL. Irmã de `escola-do-ator.ts`.
 *
 * O `actor.id` é o `usuario.id` (CLAUDE.md §10), e a abrangência `PROPRIA` da foto compara
 * contra `pessoa.id` — são chaves diferentes, e é este salto que a subconsulta dá. Resolver
 * no SQL, e não carregar o `pessoa_id` no ator, mantém o `Actor` como está: uma credencial
 * com capabilities, sem cadastro pendurado.
 */
export const pessoaDoAtor = (param = '@actorId'): string => `(
  SELECT us.pessoa_id
  FROM usuario us
  WHERE us.id = ${param}::uuid
)`;
