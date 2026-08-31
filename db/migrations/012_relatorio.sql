-- `relatorio_adaptacao` passa a se chamar `relatorio`.
--
-- "Relatório de adaptação" é um TÍTULO, não um tipo de entidade. A professora é quem diz, no
-- nome do template, se aquele é o de adaptação, o do primeiro semestre ou o do segundo — e o
-- nome da tabela estava fixando no esquema uma escolha que é do conteúdo. A estrutura
-- (período, dimensões, níveis, síntese) serve a qualquer um deles.
--
-- Policy de RLS, trigger, índices e constraints acompanham o RENAME sozinhos; só os NOMES
-- ficariam com o prefixo antigo, e é por isso que eles também são renomeados abaixo.
ALTER TABLE relatorio_adaptacao RENAME TO relatorio;

ALTER TABLE relatorio RENAME CONSTRAINT relatorio_adaptacao_pkey TO relatorio_pkey;
ALTER TABLE relatorio RENAME CONSTRAINT relatorio_adaptacao_aluno_id_fkey TO relatorio_aluno_id_fkey;
ALTER TABLE relatorio RENAME CONSTRAINT relatorio_adaptacao_turma_id_fkey TO relatorio_turma_id_fkey;
ALTER TABLE relatorio RENAME CONSTRAINT relatorio_adaptacao_autor_id_fkey TO relatorio_autor_id_fkey;
ALTER TABLE relatorio
  RENAME CONSTRAINT relatorio_adaptacao_template_origem_id_fkey TO relatorio_template_origem_id_fkey;
