/**
 * Fonte ÚNICA das permissões do sistema.
 *
 * Formato do valor: `APP:objeto:ação` — `APP` em UPPER_SNAKE, `objeto` e `ação` em
 * snake_case. A CHAVE é PascalCase espelhando objeto+ação (`consentimento_imagem` +
 * `revoke` → `ConsentimentoImagemRevoke`).
 *
 * O ESCOPO (`:any` / `:own` / `:group`) NÃO entra aqui — ele vive nas strings que o ator
 * possui (`ZELO:postagem:list:group`). `canRequest`/`can` recebem a capability CRUA.
 *
 * Organização (o arquivo cresce muito — estas regras existem para mantê-lo navegável):
 *   1. Agrupar por domínio (o prefixo APP), uma linha em branco entre domínios.
 *   2. Um comentário de cabeçalho por domínio.
 *   3. Ordem alfabética em dois níveis: domínios; dentro deles, objeto e depois ação.
 *   4. Agrupar por objeto, uma linha em branco entre objetos, com `// objeto: descrição`.
 */
export enum Feature {
  // ZELO — comunicação escola-família na educação infantil

  // aluno: crianças matriculadas
  AlunoCreate = 'ZELO:aluno:create',
  AlunoDelete = 'ZELO:aluno:delete',
  AlunoList = 'ZELO:aluno:list',
  AlunoRead = 'ZELO:aluno:read',
  AlunoUpdate = 'ZELO:aluno:update',

  // auditoria: trilha de acessos e alterações
  AuditoriaList = 'ZELO:auditoria:list',

  // consentimento_imagem: autorização de uso de imagem, com vigência e histórico
  ConsentimentoImagemCreate = 'ZELO:consentimento_imagem:create',
  ConsentimentoImagemList = 'ZELO:consentimento_imagem:list',
  ConsentimentoImagemRead = 'ZELO:consentimento_imagem:read',
  ConsentimentoImagemRevoke = 'ZELO:consentimento_imagem:revoke',

  // escola: instituição
  EscolaRead = 'ZELO:escola:read',
  EscolaUpdate = 'ZELO:escola:update',

  // postagem: registros do feed por turma
  PostagemCreate = 'ZELO:postagem:create',
  PostagemDelete = 'ZELO:postagem:delete',
  PostagemList = 'ZELO:postagem:list',
  PostagemRead = 'ZELO:postagem:read',
  PostagemUpdate = 'ZELO:postagem:update',

  // postagem_midia: anexos de imagem de uma postagem
  PostagemMidiaCreate = 'ZELO:postagem_midia:create',
  PostagemMidiaDelete = 'ZELO:postagem_midia:delete',

  // relatorio_adaptacao: relatório de adaptação da criança
  RelatorioAdaptacaoCreate = 'ZELO:relatorio_adaptacao:create',
  RelatorioAdaptacaoExport = 'ZELO:relatorio_adaptacao:export',
  RelatorioAdaptacaoList = 'ZELO:relatorio_adaptacao:list',
  RelatorioAdaptacaoRead = 'ZELO:relatorio_adaptacao:read',
  RelatorioAdaptacaoUpdate = 'ZELO:relatorio_adaptacao:update',

  // turma: turmas da escola
  TurmaCreate = 'ZELO:turma:create',
  TurmaList = 'ZELO:turma:list',
  TurmaRead = 'ZELO:turma:read',
  TurmaUpdate = 'ZELO:turma:update',

  // usuario: contas de acesso
  UsuarioCreate = 'ZELO:usuario:create',
  UsuarioList = 'ZELO:usuario:list',
  UsuarioRead = 'ZELO:usuario:read',
  UsuarioUpdate = 'ZELO:usuario:update',
}
