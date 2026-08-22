# Regras do enum `Feature`

`features.ts` é a **fonte única** das permissões. Nada de string mágica de permissão em
controller, rota ou use-case.

## Formato

`APP:objeto:ação`

- `APP` em `UPPER_SNAKE` (aqui, sempre `ZELO` — mas mantenha o prefixo, é o que permite um
  segundo domínio entrar depois **sem renomear capability em produção**).
- `objeto` e `ação` em `snake_case`.
- A **chave** do enum é `PascalCase` espelhando objeto + ação:
  `consentimento_imagem` + `revoke` → `ConsentimentoImagemRevoke`.

## O escopo NÃO entra no enum

`:own`, `:group` e `:any` vivem nas strings que o **ator possui**
(`ZELO:postagem:list:group`), não no catálogo. `canRequest(Feature.X)` e
`can(actor, Feature.X, resource)` recebem a capability **crua**.

Motivo: uma capability com escopo no enum multiplicaria cada entrada por três e ainda
obrigaria o controller a escolher qual constante usar — o escopo é decisão de runtime.

## Organização do arquivo

1. Agrupar por domínio (prefixo `APP`), uma linha em branco entre domínios.
2. Comentário de cabeçalho por domínio: `// APP — descrição curta`.
3. Ordem alfabética em dois níveis: domínios entre si; dentro de cada um, por objeto e
   depois por ação.
4. Agrupar por objeto, uma linha em branco entre objetos, com `// objeto: descrição curta`
   acima do bloco. Objetos de nome parecido (`postagem` × `postagem_midia`) são blocos
   **separados**.

## Crescimento

Mantenha o arquivo único enquanto não doer. Só quebre em um arquivo por domínio quando
precisar — e saiba da armadilha: **`enum` do TS não se funde entre arquivos**. A saída é
trocar por objetos `as const` por domínio + união de tipos
(`export const Feature = { ...A, ...B } as const`), o que **perde** o tipo nominal do enum.
Troca deliberada; não antecipe.

## Ao adicionar uma capability

1. Adicione a entrada no enum, na posição alfabética correta.
2. Conceda-a aos perfis em `db/migrations/` (tabela `perfil_capability`), **com escopo**.
3. Use `authz.canRequest(Feature.X)` como primeiro middleware da rota.
