-- Interação das famílias com a postagem: reação e comentário (zelo_v2.dbml).
-- Aditivo sobre a 001 — mesma política de ON DELETE declarada no cabeçalho dela.

-- ADD VALUE roda em transação a partir do PostgreSQL 12, mas o valor novo NÃO pode ser
-- usado na mesma transação que o criou. Por isso ele só aparece aqui; qualquer DEFAULT ou
-- CHECK que o referencie precisa de uma migration posterior.
ALTER TYPE tipo_notificacao ADD VALUE 'COMENTARIO_RECEBIDO';

CREATE TYPE status_comentario AS ENUM (
  'PUBLICADO', 'REMOVIDO_PELO_AUTOR', 'REMOVIDO_PELA_ESCOLA'
);

-- Catálogo, não enum: a interface precisa do emoji e do rótulo, e tirá-los daqui evita que
-- banco e front divirjam. `rotulo` é o texto que leitor de tela anuncia — emoji sozinho é
-- lido de forma inconsistente entre plataformas. Chave smallint porque são três linhas
-- lidas em toda montagem de feed; UUID só engordaria o índice de POSTAGEM_REACAO.
CREATE TABLE reacao (
  id        smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo    varchar(20) NOT NULL UNIQUE,
  rotulo    text NOT NULL,
  emoji     varchar(8) NOT NULL,
  ordem     smallint NOT NULL DEFAULT 0,
  ativo     boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Conteúdo inicial. Sem id explícito: a identidade atribui 1, 2 e 3 na ordem de inserção,
-- que é o que o modelo documenta, e a sequência não fica dessincronizada.
INSERT INTO reacao (codigo, rotulo, emoji, ordem) VALUES
  ('JOINHA',         'Joinha',         '👍', 1),
  ('CORACAO',        'Coração',        '❤️', 2),
  ('ROSTINHO_FELIZ', 'Rostinho feliz', '🙂', 3);

-- Uma reação por pessoa, por postagem. Trocar joinha por coração é UPDATE de `reacao_id`,
-- não linha nova — e não há coluna de contador: a soma sai de um GROUP BY sobre
-- idx_reacao_contagem. Contador desnormalizado diverge, e o volume de uma escola não pede.
--
-- RESTRICT em reacao_id: aposentar uma reação é `ativo = false`, nunca DELETE — apagar a
-- linha quebraria o histórico de quem já reagiu com ela.
CREATE TABLE postagem_reacao (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  reacao_id   smallint NOT NULL REFERENCES reacao (id) ON DELETE RESTRICT,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  alterado_em timestamptz
);

CREATE UNIQUE INDEX uq_reacao_por_usuario ON postagem_reacao (postagem_id, usuario_id);
CREATE INDEX idx_reacao_contagem ON postagem_reacao (postagem_id, reacao_id);

-- Camada única por construção: não existe coluna de comentário-pai, então não há onde
-- guardar uma resposta encadeada. A remoção é lógica — apagar a linha destruiria a prova
-- de que a moderação aconteceu, que é justamente o que a escola precisaria mostrar.
CREATE TABLE postagem_comentario (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id    uuid NOT NULL REFERENCES postagem (id) ON DELETE CASCADE,
  autor_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
  corpo          text NOT NULL,
  status         status_comentario NOT NULL DEFAULT 'PUBLICADO',
  removido_por   uuid REFERENCES usuario (id) ON DELETE SET NULL,
  removido_em    timestamptz,
  motivo_remocao text,
  editado_em     timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comentario_removido_tem_data
    CHECK (status = 'PUBLICADO' OR removido_em IS NOT NULL),
  CONSTRAINT comentario_moderado_tem_motivo
    CHECK (status <> 'REMOVIDO_PELA_ESCOLA' OR motivo_remocao IS NOT NULL)
);

CREATE INDEX idx_comentario_postagem ON postagem_comentario (postagem_id, criado_em);
CREATE INDEX idx_comentario_autor ON postagem_comentario (autor_id);

-- RLS herdada da postagem: só reage e só comenta quem já podia ver. Sem isto, a existência
-- da reação vazaria a existência da postagem para quem está fora da turma.
ALTER TABLE postagem_reacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_reacao_audiencia ON postagem_reacao
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));

ALTER TABLE postagem_comentario ENABLE ROW LEVEL SECURITY;

CREATE POLICY postagem_comentario_audiencia ON postagem_comentario
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM postagem p WHERE p.id = postagem_id));
