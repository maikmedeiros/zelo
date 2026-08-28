# Regras do enum `Feature`

`features.ts` é a **fonte única** das permissões. Nada de string mágica de permissão em
controller, rota ou use-case.

## Formato

`ACAO:RECURSO` — espelha exatamente `PERMISSAO.codigo`.

- Ambos em `UPPER_SNAKE`, em inglês, como o modelo declara.
- As **seis ações são fechadas**: `CREATE`, `VIEW`, `UPDATE`, `DELETE`, `PUBLISH`, `REVOKE`.
  Nada fora dessa lista.
- `VIEW` cobre listagem **e** leitura de item. Quem separa o que o ator enxerga é a
  abrangência, não a ação — separar `list` de `read` dobraria o catálogo sem separar nada.
- A **chave** do enum é `PascalCase` espelhando recurso + ação:
  `CONSENT` + `REVOKE` → `ConsentRevoke`.

## A abrangência NÃO entra no enum

`PROPRIA`, `TURMA` e `ESCOLA` vivem em `PERFIL_PERMISSAO.abrangencia`, na concessão, e
chegam ao ator como `ACAO:RECURSO:ABRANGENCIA`. `canRequest(Feature.X)` e
`can(actor, Feature.X, resource)` recebem a capability **crua** — passar uma com abrangência
lança 500.

Motivo: a abrangência no enum multiplicaria cada entrada por três e ainda obrigaria o
controller a escolher qual constante usar — ela é decisão de runtime, e da concessão.

A regra que o modelo não admite violar: **conteúdo de turma é abrangência `TURMA` para todo
perfil, inclusive direção.** Quem enxerga mais turmas tem mais linhas em `ACESSO_TURMA` — o
cargo não abre atalho. `ESCOLA` fica reservada a cadastro e configuração.

## Organização do arquivo

1. Agrupar por **recurso**, uma linha em branco entre recursos.
2. Ordem alfabética em dois níveis: recursos entre si; dentro de cada um, por ação.
3. Recursos de nome parecido (`CLASS` × `CLASS_ACCESS`, `REACTION` × `REACTION_TYPE`) são
   blocos **separados**.

## Crescimento

Mantenha o arquivo único enquanto não doer. Só quebre em um arquivo por domínio quando
precisar — e saiba da armadilha: **`enum` do TS não se funde entre arquivos**. A saída é
trocar por objetos `as const` por domínio + união de tipos
(`export const Feature = { ...A, ...B } as const`), o que **perde** o tipo nominal do enum.
Troca deliberada; não antecipe.

## Ao adicionar uma capability

1. Adicione a entrada no enum, na posição alfabética correta.
2. Numa **migration nova**: insira a linha em `PERMISSAO` e conceda aos perfis em
   `PERFIL_PERMISSAO`, **com abrangência**. A `004` roda uma vez — capability nova não chega
   sozinha aos perfis existentes.
3. Use `authz.canRequest(Feature.X)` como primeiro middleware da rota.

O enum e a tabela `PERMISSAO` são duas fontes da mesma verdade e precisam concordar. Gere o
`INSERT` a partir do enum em vez de digitá-lo.
