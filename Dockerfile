# Etapa de build
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++  # 🔧 por si hay dependencias nativas
RUN corepack enable

COPY package.json yarn.lock* ./

# Instalar dependencias (incluye devDependencies para poder compilar)
RUN yarn install --frozen-lockfile --ignore-engines

COPY . .

RUN yarn build


# Etapa final (producción con Nest CLI incluido)
FROM node:22-alpine AS runner
WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++  # opcional, solo si alguna lib lo requiere
RUN corepack enable

COPY package.json yarn.lock* ./

# Instalar solo dependencias de producción
RUN yarn install --frozen-lockfile --production --ignore-engines

# Instalar NestJS CLI globalmente
RUN yarn global add @nestjs/cli@^11.0.0 && \
    echo "NestJS CLI instalado. Versión: $(nest --version)" || echo "Versión no disponible"

# Copiar la carpeta dist compilada desde la etapa builder
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["yarn", "start:prod"]
