import { ReactionSummary, ReactionType } from '../../../../domain/entities/reaction.js';

export interface ReactionTypeOutput {
  code: string;
  label: string;
  emoji: string;
  order: number;
}

export interface ReactionSummaryOutput {
  postId: string;
  total: number;
  tallies: (ReactionTypeOutput & { count: number })[];
  mine: string | null;
}

export interface ReactionTypePersistenceRow {
  CODIGO: string;
  ROTULO: string;
  EMOJI: string;
  ORDEM: number;
}

export interface ReactionTallyPersistenceRow extends ReactionTypePersistenceRow {
  TOTAL: number;
}

export class ReactionMapper {
  static typeFromPersistence(row: ReactionTypePersistenceRow): ReactionType {
    return { code: row.CODIGO, label: row.ROTULO, emoji: row.EMOJI, order: row.ORDEM };
  }

  static typeToOutput(type: ReactionType): ReactionTypeOutput {
    return { ...type };
  }

  static summaryToOutput(summary: ReactionSummary): ReactionSummaryOutput {
    return { ...summary };
  }
}
