# Imagem base ALINHADA ao .nvmrc (lts/jod ↔ node:22-alpine). Ao atualizar, mexa nos dois.
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

# Registry privado via secret do BuildKit: o .npmrc existe só durante o RUN — não vira
# layer nem histórico da imagem. Sem o secret, o npm ci usa o registry público.
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Reduz a superfície da imagem final: devDependencies não vão para produção.
RUN npm prune --omit=dev


FROM node:22-alpine AS runtime

WORKDIR /app

# NENHUMA config por build-arg: toda variável (NODE_ENV, PG_*, MONGO_*, ALLOW_ORIGIN_LIST)
# é injetada em RUNTIME (`docker run -e` / compose). Nada de credencial baked na imagem.
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Diretório de mídia criado com o dono certo ANTES do USER: depois de trocar de usuário o
# mkdir falharia por permissão.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 3000

CMD ["node", "dist/main/start.js"]
