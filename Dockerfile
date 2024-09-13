ARG PARENT_VERSION=2.3.0-node20.15.0

# https://github.com/DEFRA/defra-docker-node
FROM defradigital/node:${PARENT_VERSION} AS base

USER root

WORKDIR /app

# Install app dependencies
COPY / /app
RUN npm install pm2 -g --ignore-scripts > /dev/null 2>&1 \
    && npm install --ignore-scripts && npm cache clean --force > /dev/null 2>&1

# Default service port
ARG PORT=5000

EXPOSE ${PORT}

FROM base AS development

ENTRYPOINT [ "pm2-dev", "ecosystem.config.yml" ]

FROM base AS production

RUN npm config set loglevel error \
    && npm config set audit false

ENTRYPOINT [ "pm2-runtime", "ecosystem.config.yml" ]
