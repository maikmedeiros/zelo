import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Único lugar do projeto que lê `process.env` fora do `config/env.ts`: o logger é
 * construído antes da validação do env para que a própria falha de boot seja logada.
 */
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          // O httpLogger já resume método/rota/status/duração; repetir os objetos crus
          // deixa o terminal ilegível.
          ignore: 'pid,hostname,req,res,responseTime,reqId',
        },
      },
});
