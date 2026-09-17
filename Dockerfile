ARG PARENT_VERSION=3.0.5-node24.14.1

# https://github.com/DEFRA/defra-docker-node
FROM defradigital/node:${PARENT_VERSION} AS base

USER root

WORKDIR /app

# Install app dependencies
COPY / /app
RUN npm install -g npm@11.19.0 \
    && npm install pm2 -g --ignore-scripts \
    && npm install --ignore-scripts

# Default service port
ARG PORT=5000

EXPOSE ${PORT}

FROM base AS development

ENTRYPOINT [ "pm2-dev", "ecosystem.config.yml" ]

FROM base AS production

RUN npm config set loglevel error \
    && npm config set audit false

ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]
