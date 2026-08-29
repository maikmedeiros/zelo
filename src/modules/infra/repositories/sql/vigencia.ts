/**
 * A janela de vigência dos vínculos do modelo — `matricula`, `responsavel_aluno`,
 * `professor_turma`, `acesso_turma`, `usuario_perfil`.
 *
 * **`data_fim` é o primeiro dia em que o vínculo já não vale**, e não o último em que valia.
 * A diferença aparece na revogação: encerrar grava `CURRENT_DATE`, e com a leitura inclusiva
 * (`>= CURRENT_DATE`) o `DELETE` devolvia 204 enquanto o responsável continuava enxergando a
 * criança até a virada do dia. Revogar acesso é ato imediato, não agendamento para amanhã.
 *
 * O `CHECK (data_fim >= data_inicio)` da 001 continua valendo e admite `data_fim =
 * data_inicio`: é o vínculo criado e revogado no mesmo dia, que nunca chegou a valer.
 *
 * Esta é a **única** grafia da regra na aplicação, e as views da RLS (006) têm de concordar
 * com ela. Mexeu aqui, confira as views.
 */
export const ACTIVE_PERIOD = (alias: string): string =>
  `(${alias}.data_fim IS NULL OR ${alias}.data_fim > CURRENT_DATE)`;
