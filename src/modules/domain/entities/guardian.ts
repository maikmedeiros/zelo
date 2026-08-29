export interface Guardian {
  id: string;
  personId: string;
  personName: string;
  /** Só dígitos. Nunca `null` aqui: o papel adulto exige CPF — ver `assert-person-has-cpf`. */
  cpf: string | null;
  phone: string | null;
  contactEmail: string | null;
  receiveEmail: boolean;
  receivePush: boolean;
  /** Quantas crianças estão sob responsabilidade vigente. */
  studentCount: number;
}
