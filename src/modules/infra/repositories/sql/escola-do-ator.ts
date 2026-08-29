/**
 * A escola do ator, resolvida no SQL pelo caminho `usuario → pessoa → escola_id`.
 *
 * Nenhum corpo de requisição carrega `schoolId`: o cadastro acontece na escola de quem está
 * cadastrando, e aceitar o id do cliente seria deixar um operador escrever na escola do
 * vizinho. Hoje o sistema roda com uma escola só — quando existir a segunda, o recorte já
 * está no lugar.
 */
export const escolaDoAtor = (param = '@actorId'): string => `(
  SELECT pe.escola_id
  FROM usuario us
  INNER JOIN pessoa pe ON pe.id = us.pessoa_id
  WHERE us.id = ${param}::uuid
)`;
