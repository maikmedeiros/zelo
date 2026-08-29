export interface RoleGrant {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  /** `null` quando o usuário que concedeu foi removido (`ON DELETE SET NULL`). */
  grantedById: string | null;
  grantedByName: string | null;
  startDate: string;
  endDate: string | null;
}
