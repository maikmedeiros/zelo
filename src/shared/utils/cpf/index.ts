/**
 * CPF: normalização e dígitos verificadores.
 *
 * A validação existe por causa do cadastro em duas etapas. Pessoa e papel são chamadas
 * separadas, e o que impede a mesma pessoa de virar duas linhas é o índice `uq_pessoa_cpf`
 * — que só protege quando o CPF está certo. Um dígito trocado passa pelo índice, cria a
 * segunda Ana e leva o login para uma linha e o vínculo do filho para outra.
 */

export const normalizeCpf = (value: string): string => value.replace(/\D/g, '');

const digitoVerificador = (digitos: string, pesoInicial: number): number => {
  const soma = [...digitos].reduce((acc, char, i) => acc + Number(char) * (pesoInicial - i), 0);
  const resto = (soma * 10) % 11;

  return resto === 10 ? 0 : resto;
};

export const isValidCpf = (value: string): boolean => {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11) return false;

  // Os onze repetidos (111.111.111-11 e companhia) passam na conta dos dígitos e são
  // inválidos por convenção da Receita.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  return (
    digitoVerificador(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    digitoVerificador(cpf.slice(0, 10), 11) === Number(cpf[10])
  );
};
