/**
 * O que a consulta paginada devolve junto dos itens. Vive no `domain` porque é parte do
 * contrato do repositório; o envelope que o cliente enxerga é outra coisa, e mora na
 * apresentação (`@shared/presenters`).
 */
export interface PageInfo {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}
