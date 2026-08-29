import { PostgresDatabase } from '@shared/infra/database/index.js';
import { Media, MediaFile } from '../../domain/entities/media.js';
import { CreateMediaData, IMediaRepository } from '../../domain/repositories/i-media-repository.js';
import {
  MediaFilePersistenceRow,
  MediaMapper,
  MediaPersistenceRow,
} from '../../application/mappers/posts/media/media-mapper.js';

const COLUNAS = `
  m.id::text          AS "ID",
  m.postagem_id::text AS "POSTAGEM_ID",
  m.mime              AS "MIME",
  m.bytes             AS "BYTES",
  m.ordem             AS "ORDEM",
  m.criado_em         AS "CRIADO_EM"
`;

const SELECT_BY_POST = `
  SELECT ${COLUNAS}
  FROM midia m
  WHERE m.postagem_id = @postId::uuid
  ORDER BY m.ordem, m.criado_em;
`;

// O `postId` entra no WHERE embora `mediaId` já seja único: a rota é aninhada, e uma mídia
// pedida sob a postagem errada não é "encontrada". Sem isto, qualquer um que enxergue uma
// postagem qualquer leria a mídia de outra só trocando o id.
const SELECT_FILE = `
  SELECT m.chave_original AS "CHAVE_ORIGINAL", m.mime AS "MIME"
  FROM midia m
  WHERE m.id = @mediaId::uuid AND m.postagem_id = @postId::uuid;
`;

// `ordem` sai de max + 1 na própria inserção. Calcular na aplicação exigiria ler antes de
// escrever, e duas fotos subindo juntas receberiam o mesmo número.
//
// `status` fica em PROCESSADA: não há pipeline de variante ainda, e deixar PENDENTE
// prometeria um processamento que ninguém vai executar. Quando a geração de THUMBNAIL
// existir, é aqui que o valor inicial volta a ser PENDENTE.
const INSERT = `
  INSERT INTO midia (postagem_id, chave_original, mime, bytes, ordem, status)
  VALUES (
    @postId::uuid,
    @key::text,
    @mimeType::text,
    @sizeBytes::bigint,
    coalesce((SELECT max(m2.ordem) FROM midia m2 WHERE m2.postagem_id = @postId::uuid), 0) + 1,
    'PROCESSADA'
  )
  RETURNING ${COLUNAS.replaceAll('m.', 'midia.')};
`;

const DELETE = `
  DELETE FROM midia m
  WHERE m.id = @mediaId::uuid AND m.postagem_id = @postId::uuid
  RETURNING m.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class MediaRepository implements IMediaRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async listByPost(postId: string): Promise<Media[]> {
    const rows = await this.db.query<MediaPersistenceRow>(SELECT_BY_POST, { postId });
    return rows.map(MediaMapper.fromPersistence);
  }

  async findFile(mediaId: string, postId: string): Promise<MediaFile | null> {
    const rows = await this.db.query<MediaFilePersistenceRow>(SELECT_FILE, { mediaId, postId });
    const row = rows[0];

    return row ? { key: row.CHAVE_ORIGINAL, mimeType: row.MIME } : null;
  }

  async create(data: CreateMediaData): Promise<Media> {
    const rows = await this.db.query<MediaPersistenceRow>(INSERT, {
      postId: data.postId,
      key: data.key,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    });

    // O INSERT tem RETURNING e a postagem já foi validada pelo use-case: recordset vazio
    // aqui seria defeito, não ausência.
    const row = rows[0];
    if (!row) throw new Error('INSERT de midia não devolveu linha');

    return MediaMapper.fromPersistence(row);
  }

  async remove(mediaId: string, postId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { mediaId, postId });
    return rows.length > 0;
  }
}
