# Regras dos validators

Um arquivo por feature, agrupado por recurso (`validators/<recurso>/<feature>.validator.ts`),
reexportado no `index.ts` do recurso.

## Sempre `safeParse`, nunca `.parse`

Em falha: **`throw new ValidationError({ cause: result.error.issues })`**. Nada de
`res.status(400)` aqui, nada de `try/catch` — o error handler global é quem serializa.

## O que fazer por parte do request

| Parte      | O que fazer                                                                |
| ---------- | -------------------------------------------------------------------------- |
| **Body**   | `safeParse(req.body)` e **reatribuir** `req.body = result.data`            |
| **Params** | `safeParse(req.params)` — só validar, **sem** reatribuir                   |
| **Query**  | `safeParse(req.query)` — **nunca reatribuir**. O **controller re-parseia** |

A query não é reatribuível porque no Express 5 `req.query` é um **getter sem setter**. O
controller re-parseia com o **mesmo schema** para receber o dado coergido e defaultado.

## Schema

O schema mora em `application/dtos/<recurso>/<feature>/input.ts`, não aqui. O validator
apenas o aplica.

- Corpo de escrita (`POST`/`PUT`/`PATCH`): **`z.strictObject`**, inclusive objetos aninhados.
- Query e params: **`z.object`** (lenientes) — a query string acumula lixo incidental
  (`utm_*`, cache-buster) que não deve virar 400, e params vêm da própria URL.

## Identificador: `z.guid()`, nunca `z.uuid()`

No Zod 4 o `z.uuid()` valida os nibbles de **versão e variante** da RFC 4122. As colunas
`uuid` do PostgreSQL não validam nada disso, e o projeto usa UUID sentinela — a escola
padrão é `00000000-0000-0000-0000-000000000001`, e o `db/seeds/demo.sql` segue o mesmo
padrão legível. Todos eles são **reprovados** pelo `z.uuid()`.

Resultado: um `:id` que o banco emitiu voltaria como 400. Use **`z.guid()`**, que valida só
o formato 8-4-4-4-12 — exatamente o que a coluna aceita.

## Upload

Quando a rota recebe `multipart/form-data`, o `multer` já rodou (ele entra entre a
autorização e o validator). Campos de texto chegam como **string** em `req.body`, então o
schema precisa de `z.coerce`/`JSON.parse` no `preprocess` para os campos não escalares.
