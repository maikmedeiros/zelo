import { db } from '@config/database.js';
import { Feature } from '@config/features.js';
import { InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/logger/index.js';

interface CapabilityRow {
  CODIGO: string;
}

/**
 * O enum `Feature` e a tabela `PERMISSAO` são duas fontes de verdade para o mesmo catálogo, e
 * a divergência entre elas não aparece como erro — aparece como 403 inexplicável.
 *
 * Código no enum e não na tabela é o caso perigoso: `canRequest` compara contra as features
 * que vieram do banco, então ninguém jamais terá aquela capability, e toda requisição à rota
 * é negada sem que nada acuse o motivo. O contrário — linha na tabela sem uso no código — é
 * concessão que não protege nada, mas ainda é sinal de que alguém esqueceu metade da mudança.
 *
 * Lança no boot, no mesmo espírito da validação de env: melhor não subir do que subir errado.
 */
export const assertFeaturesInSync = async (): Promise<void> => {
  const rows = await db.core.query<CapabilityRow>('SELECT codigo AS "CODIGO" FROM permissao;');

  const naTabela = new Set(rows.map((row) => row.CODIGO));
  const noEnum = new Set<string>(Object.values(Feature));

  const ausentesNaTabela = [...noEnum].filter((codigo) => !naTabela.has(codigo)).sort();
  const ausentesNoEnum = [...naTabela].filter((codigo) => !noEnum.has(codigo)).sort();

  if (ausentesNaTabela.length === 0 && ausentesNoEnum.length === 0) {
    logger.debug(`Catálogo de capability conferido: ${noEnum.size} códigos`);
    return;
  }

  throw new InternalServerError({
    message: 'Catálogo de capability divergente entre o enum Feature e a tabela PERMISSAO',
    cause: { ausentesNaTabela, ausentesNoEnum },
  });
};
