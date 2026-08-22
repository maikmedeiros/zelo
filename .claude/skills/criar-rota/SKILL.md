---
name: criar-rota
description: Cria uma rota nova na API do Zelo seguindo a arquitetura do projeto — gera os 12 arquivos das camadas na ordem correta (capability, entity, contrato de repositório, DTOs, mapper, use-case, repositório, validator, controller, factory, arquivo de rota) com as convenções de nomenclatura, Zod e SQL já aplicadas. Use quando o pedido for adicionar, criar ou expor um endpoint/rota/recurso novo nesta API.
---

# Criar uma rota

Automatiza o checklist da seção 12 do [CLAUDE.md](../../../CLAUDE.md) na raiz do projeto.
**Leia o CLAUDE.md antes de gerar código** — ele é a fonte das convenções; esta skill é só o
procedimento.

## Passo 0 — colete o que falta

Não gere nada antes de ter as cinco respostas. Se alguma não estiver no pedido, pergunte:

1. **Método HTTP e caminho**, sem o prefixo `/v1` (o loader aplica).
2. **Entrada**: query, body e/ou path params — com obrigatoriedade, tipo e regras.
3. **Formato exato do retorno**: status + JSON.
4. **SQL**: a query/proc, ou a decisão explícita de mockar (marcada com `// TODO(db)`).
5. **Capability**: `ZELO:objeto:ação`. Se não existir no enum, ela é criada no passo 1.

## Passo 1 — derive os nomes

Da operação, derive o nome da feature (é obrigatório, não é gosto):

| Operação           | Padrão                      | Exemplo               |
| ------------------ | --------------------------- | --------------------- |
| Leitura de coleção | `find-list-<recurso>`       | `find-list-postagens` |
| Leitura de item    | `find-<recurso>-by-<campo>` | `find-postagem-by-id` |
| Escrita            | `<verbo>-<recurso>`         | `create-postagem`     |

**Nunca `get-` nem `list-`.** Todos os símbolos seguem a feature:
`FindListPostagensUseCase`, `FindListPostagensController`, `findListPostagensValidator`,
`makeFindListPostagensController`.

Derive também o **caminho de pasta** a partir da URL: cada segmento de recurso vira uma
pasta, a feature fica na ponta, **params não viram pasta**.
`POST /postagens/:postagemId/comentarios` → `postagens/comentarios/create-comentario/`.

## Passo 2 — gere os arquivos NESTA ordem

Cada um depende do anterior. Pare e verifique se algo não encaixar.

| #   | Arquivo                                                           | Regra que não pode ser esquecida                                                                               |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | `src/config/features.ts`                                          | Entrada na posição **alfabética**; conceda a capability **com escopo** em `db/migrations/002_capabilities.sql` |
| 2   | `src/modules/zelo/domain/entities/<conceito>.ts`                  | **Reuse** se já existir. `camelCase`, sem Zod, sem framework                                                   |
| 3   | `src/modules/zelo/domain/repositories/i-<agregado>-repository.ts` | Nome do método **não** segue a feature: `list()`, `findById()`                                                 |
| 4   | `.../application/dtos/<caminho>/input.ts`                         | Corpo de escrita → `z.strictObject`. Query/params → `z.object`                                                 |
| 5   | `.../application/dtos/<caminho>/output.ts`                        | Coleção devolve `{ items, pagination }` — **nunca** `results`                                                  |
| 6   | `.../application/mappers/<recurso>/<x>-mapper.ts`                 | `*PersistenceRow` em UPPER_SNAKE; métodos **estáticos**                                                        |
| 7   | `.../application/use-cases/<caminho>/<feature>.usecase.ts`        | Recebe **interfaces**. Sem envelope, sem HTTP, **sem try/catch**                                               |
| 8   | `.../infra/repositories/<agregado>.repository.ts`                 | Params **nomeados** (`@nome`); alias UPPER_SNAKE **entre aspas duplas**; ausência → `null` explícito           |
| 9   | `.../presentation/validators/<recurso>/<feature>.validator.ts`    | `safeParse` + `throw new ValidationError`. **Query nunca é reatribuída**                                       |
| 10  | `.../presentation/controllers/<caminho>/<feature>.controller.ts`  | Re-parseia a query; monta o envelope; resolve o escopo `:own`/`:any`                                           |
| 11  | `src/main/factories/<caminho>/<feature>.factory.ts`               | Único lugar que conhece classe concreta e o singleton `db`. Reexporte no `index.ts`                            |
| 12  | `src/main/routes/<recurso>.routes.ts`                             | `canRequest` → validator → `controller(...)`. **Estáticas antes de params**                                    |

**Recurso já existe?** Não crie arquivo de rota novo: adicione ao existente, adicione o
método à interface + implementação do repositório e o `make*Controller` ao `index.ts`,
reaproveitando entity e mapper.

**Upload?** O `multer` entra **entre** a autorização e o validator — sem isso o `req.body`
do multipart chega vazio. Campos não escalares chegam como **string**: normalize no
validator antes do `strictObject`.

## Passo 3 — verifique

```bash
npm run build   # noEmitOnError → build == typecheck. É o gate.
npm run dev
```

Depois exercite, e relate o que observou:

- **401** sem credencial (esperado — o `injectActor` é global; não é bug da rota)
- **400** com entrada inválida, e confira que chave desconhecida no corpo é rejeitada
- **403** com um ator sem a capability
- **404** com id inexistente
- o caminho de sucesso, conferindo o **formato exato** combinado no passo 0

Se não houver banco disponível, diga isso explicitamente em vez de afirmar que a rota
funciona.
