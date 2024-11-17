FROM node:20-bullseye-slim AS builder
# Set working directory
WORKDIR /usr/src/app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=temporal-worker --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-bullseye-slim AS installer
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/out/json/ .
COPY --from=builder /usr/src/app/out/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/turbo.json ./turbo.json
RUN yarn install --frozen-lockfile

FROM node:20-bullseye-slim AS sourcer
WORKDIR /usr/src/app
COPY --from=installer /usr/src/app/ .
COPY --from=builder /usr/src/app/out/full/ .
COPY .gitignore .gitignore
RUN yarn build --filter=temporal-worker

FROM node:20-bullseye-slim AS runner
# https://docs.temporal.io/develop/typescript/core-application#using-nodeslim-images
RUN apt-get update \
    && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
COPY --from=sourcer /usr/src/app/ .
CMD [ "node", "apps/temporal-worker/dist/main.js" ]
