import { Scope } from '@shared/auth/index.js';

export interface RolePermission {
  /** Capability crua, no formato `ACAO:RECURSO`. */
  code: string;
  scope: Scope;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /**
   * Perfil de sistema. Provisionado por migration e **não editável pela API**: as suas
   * concessões são a base do modelo de autorização, e alterá-las em runtime é o caminho mais
   * curto para alguém se dar permissões que não tinha.
   */
  system: boolean;
  permissions: RolePermission[];
  /** Quantos usuários carregam este perfil com concessão vigente. */
  userCount: number;
}
