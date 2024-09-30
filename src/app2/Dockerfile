FROM node:18-alpine As installer

RUN apk add g++ make py3-pip

WORKDIR /usr/src/app
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./
RUN yarn install --immutable
USER node

FROM node:18-alpine As builder

WORKDIR /usr/src/app
COPY --from=installer --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
RUN yarn build
RUN yarn install --immutable --production && yarn cache clean
USER node

FROM node:18-alpine As production

ENV NODE_ENV production
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
CMD [ "node", "dist/src/main.js" ]
