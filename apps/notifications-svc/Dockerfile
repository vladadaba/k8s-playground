FROM node:20-alpine AS builder
RUN apk update
# Set working directory
WORKDIR /usr/src/app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=notifications-svc --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-alpine AS installer
RUN apk update
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/out/json/ .
COPY --from=builder /usr/src/app/out/yarn.lock ./yarn.lock
COPY --from=builder /usr/src/app/turbo.json ./turbo.json
# COPY --from=builder /usr/src/app/apps/notifications-svc/prisma ./prisma
RUN yarn install --frozen-lockfile
# RUN yarn prisma generate 


FROM node:20-alpine AS sourcer
WORKDIR /usr/src/app
COPY --from=installer /usr/src/app/ .
COPY --from=builder /usr/src/app/out/full/ .
COPY --from=builder /usr/src/app/tsconfig.base.json ./tsconfig.base.json
COPY .gitignore .gitignore
RUN yarn build --filter=notifications-svc

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=sourcer /usr/src/app/ .
CMD [ "node", "apps/notifications-svc/dist/main.js" ]
