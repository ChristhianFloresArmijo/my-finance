# Development Dockerfile
FROM node:22

RUN npm install -g npm@latest && npm install -g pnpm@latest-10

RUN mkdir -p /app && chown node:node /app

USER node

WORKDIR /app

COPY --chown=node:node . .

ENTRYPOINT ["./setup.sh"]
