import { SCOPES, Scope } from '@shared/auth/index.js';
import { ForbiddenError } from '@shared/errors/index.js';
import { RolePermission } from '../../../domain/entities/role.js';

/** Decide se o ator carrega a capability na abrangência pedida — ou em uma mais ampla. */
export type ScopeChecker = (code: string) => Scope[];

const AMPLITUDE = new Map<Scope, number>(SCOPES.map((scope, index) => [scope, index]));

const alcanca = (concedidas: Scope[], pedida: Scope): boolean => {
  const alvo = AMPLITUDE.get(pedida) ?? 0;
  return concedidas.some((scope) => (AMPLITUDE.get(scope) ?? -1) >= alvo);
};

/**
 * Ninguém dá o que não tem.
 *
 * Sem esta regra, quem tivesse `CREATE:ROLE` poderia montar um perfil com as 69 capabilities
 * em `ESCOLA`, conceder o perfil a si mesmo e virar administrador — sem que nada no modelo
 * tivesse sido violado. É a escalada clássica, e ela existe justamente porque o cadastro de
 * perfis é, por natureza, a rota que fabrica permissão.
 *
 * A abrangência entra na conta: quem tem `VIEW:POST` só em `TURMA` não pode conceder
 * `VIEW:POST` em `ESCOLA`. O contrário é permitido — conceder menos do que se tem é legítimo.
 */
export const assertNoEscalation = (permissions: RolePermission[], scopesOf: ScopeChecker): void => {
  const acima = permissions.filter(
    (permission) => !alcanca(scopesOf(permission.code), permission.scope),
  );

  if (acima.length === 0) return;

  throw new ForbiddenError({
    message: 'Não é possível conceder permissão que o próprio ator não tem',
    cause: { beyondActor: acima },
  });
};
